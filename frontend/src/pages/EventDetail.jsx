import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { t } from '../i18n.js';
import CalendarOptions from '../components/CalendarOptions.jsx';
import { EventTag, LiveTag, NoticeTag } from '../components/EventVisuals.jsx';
import { ShareIcon } from '../components/Icons.jsx';
import LiveModal from '../components/LiveModal.jsx';
import LoadStatus from '../components/LoadStatus.jsx';
import { EventSkeleton } from '../components/Skeletons.jsx';
import LongArrow from '../components/LongArrow.jsx';
import { categoryLabel, eventKind, useEvent, useEvents } from '../api/events.js';
import { useLive } from '../api/live.js';
import { useChurch } from '../api/church.js';
import { monthLabel } from '../api/dates.js';
import { placeMapUrl } from '../api/maps.js';
import './EventDetail.css';

// Дата «2026-10-01» со сдвигом на days дней — границы запроса «Рядом по датам».
function shiftDate({ year, month, day }, days) {
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

// Три события, ближайшие по времени к этому (раньше и позже), по порядку дат.
function useNearby(event) {
  const { events } = useEvents({ from: shiftDate(event, -7), to: shiftDate(event, 21) });

  return useMemo(() => {
    const start = Date.parse(event.startsAt);

    return events
      .filter((e) => e.id !== event.id)
      .sort((a, b) => Math.abs(Date.parse(a.startsAt) - start) - Math.abs(Date.parse(b.startsAt) - start))
      .slice(0, 3)
      .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  }, [event, events]);
}

// Сообщение внизу экрана на пару секунд: «Ссылка скопирована».
function useToast() {
  const [toast, setToast] = useState('');
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const show = useCallback((text) => {
    clearTimeout(timer.current);
    setToast(text);
    timer.current = setTimeout(() => setToast(''), 2000);
  }, []);

  return [toast, show];
}

export default function EventDetail() {
  const { id } = useParams();
  const { event: ev, loading, error, retry } = useEvent(id);

  if (loading || error) {
    return (
      <div className="page-enter container ev-page">
        {error ? <LoadStatus error={error} onRetry={retry} /> : <EventSkeleton />}
      </div>
    );
  }

  if (!ev) {
    return (
      <div className="page-enter container ev-page">
        <p>Событие не найдено.</p>
        <Link to="/schedule">← К расписанию</Link>
      </div>
    );
  }

  // Основная ссылка — кнопкой в панели, остальные — плашками под описанием.
  const otherLinks = ev.links.filter((link) => !link.primary);

  return (
    <div className="page-enter container ev-page">
      <Link to="/schedule" className="ev-back">← Расписание</Link>

      <div className={`ev-layout is-${eventKind(ev)}`}>
        <div className="ev-head">
          <div className="ev-tags">
            {ev.notice && <NoticeTag>{ev.notice}</NoticeTag>}
            {ev.live && <LiveTag />}
            {ev.category && <EventTag>{categoryLabel(ev.category)}</EventTag>}
          </div>
          <h1 className="ev-title">{ev.title}</h1>
        </div>

        <InfoPanel event={ev} />

        <div className="ev-body">
          {(ev.desc.length > 0 || otherLinks.length > 0) && <About paragraphs={ev.desc} links={otherLinks} />}
          {ev.sermon && <Sermon eventId={ev.id} sermon={ev.sermon} />}
          {ev.hymns?.length > 0 && <Hymns hymns={ev.hymns} />}
        </div>

        <Nearby event={ev} />
      </div>
    </div>
  );
}

// Панель с датой, временем, местом и кнопками; цвет — по типу события (eventKind, класс is-… у .ev-layout).
// На телефоне вместе с заголовком над ней это одна карточка-«билет».
function InfoPanel({ event: ev }) {
  const live = useLive();
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [liveOpen, setLiveOpen] = useState(false);
  const closeLive = useCallback(() => setLiveOpen(false), []);
  const [toast, showToast] = useToast();

  const church = useChurch();
  const routeUrl = placeMapUrl(ev.addr, church);
  // «Смотреть» — прямая ссылка события или, пока идёт эфир, выбор площадки, как в плашке «В эфире».
  const canWatch = Boolean(ev.streamUrl) || Boolean(ev.live && live?.isLive && (live.links.length > 0 || live.signLink));

  // Системное меню «Поделиться», а где его нет — ссылка в буфер обмена.
  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: ev.title, url: window.location.href });
        return;
      }
      await navigator.clipboard.writeText(window.location.href);
      showToast(t('Ссылка скопирована'));
    } catch (shareError) {
      // Пользователь закрыл меню «Поделиться» — это не ошибка.
      if (shareError?.name !== 'AbortError') showToast(t('Не удалось скопировать ссылку'));
    }
  };

  const calendarButton = (primary) => (
    <button type="button" className={primary ? 'ev-btn is-primary' : 'ev-btn'} onClick={() => setCalendarOpen((open) => !open)} aria-expanded={calendarOpen}>
      В календарь
    </button>
  );

  // Основная ссылка (например, регистрация) — крупной кнопкой вместо «В календарь»; во время эфира
  // главная кнопка — «Смотреть», а основная ссылка встаёт рядом вместо «В календарь».
  const mainLink = ev.links.find((link) => link.primary);
  const mainLinkButton = (primary) => (
    <a href={mainLink.url} target="_blank" rel="noopener noreferrer" className={primary ? 'ev-btn is-primary' : 'ev-btn'}>{mainLink.text}</a>
  );
  const primaryButton = canWatch
    ? (ev.streamUrl
      ? <a href={ev.streamUrl} target="_blank" rel="noreferrer" className="ev-btn is-primary">Смотреть</a>
      : <button type="button" className="ev-btn is-primary" onClick={() => setLiveOpen(true)} aria-haspopup="dialog">Смотреть</button>)
    : mainLink ? mainLinkButton(true) : calendarButton(true);
  const secondaryButton = canWatch
    ? (mainLink ? mainLinkButton(false) : calendarButton(false))
    : mainLink && calendarButton(false);
  // Маршрут открывает весь блок места (плашка «Маршрут» — подсказка), отдельной кнопки в ряду нет.
  const placeText = (
    <span className="ev-place-text">
      {ev.place && <span className="ev-place-name">{ev.place}</span>}
      {ev.addr && <span className="ev-place-addr">{ev.addr}</span>}
    </span>
  );
  const shareButton = (
    <button type="button" className="ev-round ev-share" onClick={share} title={t('Поделиться')} aria-label={t('Поделиться')}>
      <ShareIcon />
    </button>
  );

  return (
    <div className="ev-panel">
      <div className="ev-when">
        <div className="ev-date">
          <span className="ev-day">{ev.day}</span>
          <span className="ev-date-side">
            {/* Месяц целиком: «ноября»; сокращение «нояб» остаётся в плашках списков. */}
            <span className="ev-mon">{monthLabel(ev)}</span>
            <span className="ev-dow">{ev.dowLabel}</span>
          </span>
        </div>
        <div className="ev-time">{ev.timeRange}</div>
      </div>

      {(ev.place || ev.addr) && (
        routeUrl
          ? <a href={routeUrl} target="_blank" rel="noreferrer" className="ev-place">{placeText}<span className="ev-route">Маршрут<span aria-hidden="true">↗</span></span></a>
          : <div className="ev-place">{placeText}</div>
      )}

      {/* Без второй кнопки «Поделиться» встаёт в ряд с главной, а не одна под ней. */}
      <div className="ev-actions">
        {secondaryButton ? (
          <>
            {primaryButton}
            <div className="ev-actions-row">
              {secondaryButton}
              {shareButton}
            </div>
          </>
        ) : (
          <div className="ev-actions-row">
            {primaryButton}
            {shareButton}
          </div>
        )}
      </div>

      {calendarOpen && (
        <CalendarOptions
          options={[
            { label: t('Google Календарь'), href: ev.calendar.google, external: true },
            { label: 'Outlook', href: ev.calendar.outlook, external: true },
            { label: t('Apple, Яндекс и другие'), hint: t('файл .ics'), href: ev.calendar.ics },
          ]}
        />
      )}

      {liveOpen && live && <LiveModal live={live} onClose={closeLive} />}
      {toast && <div className="ev-toast" role="status">{toast}</div>}
    </div>
  );
}

// «О событии»: первый абзац крупно, остальные раскрываются кнопкой «Читать полностью»; ниже — ссылки события.
function About({ paragraphs, links = [] }) {
  const [open, setOpen] = useState(false);
  const [lead, ...rest] = paragraphs;

  return (
    <section className="ev-section">
      <span className="ev-label">О событии</span>
      {lead && <p className="ev-lead">{lead}</p>}
      {open && rest.map((text, i) => <p key={i} className="ev-text">{text}</p>)}
      {rest.length > 0 && (
        <button type="button" className="ev-more" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
          {/* Через t(): React меняет текст в том же узле, а translatePage() такие правки не видит. */}
          {open ? t('Свернуть ↑') : t('Читать полностью ↓')}
        </button>
      )}
      {links.length > 0 && (
        <div className="ev-links">
          {links.map((link) => (
            <a key={link.url + link.text} href={link.url} target="_blank" rel="noopener noreferrer" className="ev-out">
              {link.text}
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}

// Проповедь — тёмная карточка: проповедник, место Писания, тема и переход к конспекту.
function Sermon({ eventId, sermon }) {
  return (
    <section className="ev-section">
      <span className="ev-label ev-desktop">Проповедь</span>
      <Link to={`/schedule/${eventId}/sermon`} className="ev-sermon">
        <span className="ev-sermon-who">
          <span className="ev-sermon-initial">{sermon.initial}</span>
          <span className="ev-sermon-name">
            <span>{sermon.name}</span>
            <span className="ev-sermon-meta">{[sermon.role, sermon.ref].filter(Boolean).join(' · ')}</span>
          </span>
        </span>
        <span className="ev-sermon-mobile-meta">{[t('Проповедь'), sermon.ref].filter(Boolean).join(' · ')}</span>
        <span className="ev-sermon-topic">«{sermon.topic}»</span>
        <span className="ev-sermon-foot">
          <span className="ev-sermon-mobile-name">{sermon.name}</span>
          <span className="ev-sermon-btn">Конспект →</span>
        </span>
      </Link>
    </section>
  );
}

// Гимны служения — список с линиями, у каждого номер и название.
function Hymns({ hymns }) {
  return (
    <section className="ev-section">
      <div className="ev-section-head">
        <span className="ev-label">Гимны служения</span>
        <Link to="/songs" className="ev-link">Весь сборник →</Link>
      </div>
      <div className="ev-hymns">
        {hymns.map((song) => (
          <Link key={`${song.id}${song.variant ?? ''}`} to={`/songs/${song.id}${song.variant ? `?v=${encodeURIComponent(song.variant)}` : ''}`} className="ev-hymn">
            <span className="ev-hymn-num">
              <span className="ev-hymn-word">Гимн</span>
              <span>{song.num}{song.variant}</span>
            </span>
            <span className="ev-hymn-title">{song.title}</span>
            <LongArrow width={28} stroke={2.6} />
          </Link>
        ))}
      </div>
    </section>
  );
}

// «Рядом по датам» — ближайшие события строками с плашкой даты. Пока грузятся или их нет — блока нет.
function Nearby({ event }) {
  const events = useNearby(event);
  if (events.length === 0) return null;

  return (
    <section className="ev-nearby">
      <span className="ev-label">Рядом по датам</span>
      <div className="ev-nearby-list">
        {events.map((e) => (
          <Link key={e.id} to={`/schedule/${e.id}`} className="ev-near">
            <span className="ev-near-date">
              <span className="ev-near-num">{e.day}</span>
              <span className="ev-near-mon">{e.mon}</span>
            </span>
            <span className="ev-near-body">
              <span className="ev-near-title">{e.title}</span>
              <span className="ev-near-time">{e.timeLabel ?? t('Весь день')}</span>
            </span>
            <LongArrow width={28} stroke={2.6} />
          </Link>
        ))}
      </div>
    </section>
  );
}

