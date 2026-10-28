import { useState } from 'react';
import { Link } from 'react-router-dom';
import { t } from '../i18n.js';
import { ImportantPill, Megaphone } from './AnnouncementCards.jsx';
import { CampaignIcon, DoneAllIcon, EventIcon, PhoneIcon, PlaceIcon, ScheduleIcon, ShareIcon } from './Icons.jsx';
import LongArrow from './LongArrow.jsx';
import './AnnouncementBoard.css';

// Сколько показывается одно объявление в сторис; столько же длится заливка сегмента в CSS (--ann7-ms).
const STORY_MS = 7000;
// Сколько объявлений в сторис: все важные и последние из остальных, но не меньше двух последних.
const STORY_COUNT = 5;

// Набор сторис: важные (новые первыми), за ними последние опубликованные неважные. items уже по дате публикации.
function storySet(items) {
  const important = items.filter((item) => item.important);
  const latest = items.filter((item) => !item.important).slice(0, Math.max(2, STORY_COUNT - important.length));

  return [...important, ...latest];
}

// Как показывать дату: связанное событие важнее собственных дат объявления.
function dateKind(item) {
  if (item.event) return 'event';
  if (item.eventEnd) return 'range';
  if (item.eventDate) return 'date';
  if (item.deadline) return 'until';
  if (item.regular) return 'regular';

  return 'none';
}

const detail = (item, type) => item.details.find((entry) => entry.type === type);

// Плитка даты в строке списка: три строки — «Вс–Сб / 15–21 / нояб», «До / 4 / нояб», «Кажд. / Пт / 19:00».
function tileLines(item, kind) {
  switch (kind) {
    case 'event':
      return [item.event.dowShort, item.event.day, item.event.mon];
    case 'range': {
      const { eventDate: from, eventEnd: to } = item;
      return [`${from.dow}–${to.dow}`, `${from.day}–${to.day}`, from.mon === to.mon ? from.mon : `${from.mon}–${to.mon}`];
    }
    case 'date':
      return [item.eventDate.dow, item.eventDate.day, item.eventDate.mon];
    case 'until':
      return [t('До'), item.deadline.day, item.deadline.mon];
    case 'regular':
      return [t('Кажд.'), item.regular.dow, item.regular.time];
    default:
      return null;
  }
}

// Время в строке списка: у события — его время, у нескольких дней — длительность, у регулярного — день недели.
function rowTime(item, kind) {
  switch (kind) {
    case 'event':
      return item.event.timeRange;
    case 'range':
      return item.days;
    case 'regular':
      return item.regular.weekday;
    default:
      return detail(item, 'when')?.text ?? null;
  }
}

const placeOf = (item) => (item.event ? item.event.place : detail(item, 'where')?.text) || null;

// Строка списка (макет design_handoff_announcements 2, вариант 7a): плитка даты с голубой точкой непрочитанного,
// «Важно» и метка «В расписании», заголовок, время и место. active — открыто в сторис.
function AnnouncementRow({ item, active, read, unread, onOpen }) {
  const kind = dateKind(item);
  const lines = tileLines(item, kind);
  const time = rowTime(item, kind);
  const place = placeOf(item);

  return (
    <button
      type="button"
      className={`ann7-row ${active ? 'is-active' : ''} ${read ? 'is-read' : ''}`}
      aria-current={active ? 'true' : undefined}
      onClick={onOpen}
    >
      <span className="ann7-tile">
        {lines ? (
          <>
            <span className="ann7-tile-label">{lines[0]}</span>
            <span className="ann7-tile-big">{lines[1]}</span>
            <span className="ann7-tile-bottom">{lines[2]}</span>
          </>
        ) : (
          <CampaignIcon size={26} />
        )}
        {unread && <span className="ann7-tile-dot" />}
      </span>

      <span className="ann7-row-text">
        {(item.important || item.event) && (
          <span className="ann7-row-chips">
            {item.important && <ImportantPill />}
            {item.event && (
              <span className="ann7-row-event">
                <EventIcon size={13} />
                <span>В расписании</span>
              </span>
            )}
          </span>
        )}
        <span className="ann7-row-title">{item.title}</span>
        {(time || place) && (
          <span className="ann7-row-meta">
            {time && (
              <span>
                <ScheduleIcon size={14} />
                {time}
              </span>
            )}
            {place && (
              <span>
                <PlaceIcon size={14} />
                {place}
              </span>
            )}
          </span>
        )}
      </span>

      {read ? <span className="ann7-row-done"><DoneAllIcon size={18} /></span> : <LongArrow width={28} stroke={2.6} />}
    </button>
  );
}

// Число с месяцем справа от него: «15 нояб».
function BigDate({ date }) {
  return (
    <span className="ann7-big-date">
      <span className="ann7-big-num">{date.day}</span>
      <span className="ann7-big-mon">{date.mon}</span>
    </span>
  );
}

// Правая часть сторис: карточка связанного события или крупная дата по типу объявления.
function StoryWhen({ item }) {
  const kind = dateKind(item);
  const when = detail(item, 'when')?.text;

  if (kind === 'event') {
    const { event } = item;
    return (
      <Link to={`/schedule/${event.id}`} className="ann7-event">
        <span className="ann7-event-head">
          <EventIcon size={15} />
          <span>Событие в расписании</span>
        </span>
        <span className="ann7-event-body">
          <span className="ann7-event-tile">
            <span className="ann7-event-dow">{event.dowShort}</span>
            <span className="ann7-event-day">{event.day}</span>
            <span className="ann7-event-mon">{event.mon}</span>
          </span>
          <span className="ann7-event-text">
            <span className="ann7-event-title">{event.title}</span>
            <span className="ann7-event-time">{event.timeRange}</span>
            {event.place && (
              <span className="ann7-event-place">
                <PlaceIcon size={14} />
                {event.place}
              </span>
            )}
          </span>
        </span>
        <span className="ann7-event-foot">
          <span>Открыть в расписании</span>
          <LongArrow width={28} stroke={2.6} />
        </span>
      </Link>
    );
  }

  if (kind === 'range') {
    return (
      <div className="ann7-when">
        <div className="ann7-range">
          <span className="ann7-range-part">
            <span className="ann7-when-note">{item.eventDate.dow}</span>
            <BigDate date={item.eventDate} />
          </span>
          <span className="ann7-range-arrow"><LongArrow width={28} stroke={2.6} /></span>
          <span className="ann7-range-part">
            <span className="ann7-when-note">{item.eventEnd.dow}</span>
            <BigDate date={item.eventEnd} />
          </span>
        </div>
        <span className="ann7-days">{item.days}</span>
      </div>
    );
  }

  if (kind === 'date' || kind === 'until') {
    const date = kind === 'date' ? item.eventDate : item.deadline;
    return (
      <div className="ann7-when">
        <span className="ann7-when-note">{kind === 'date' ? date.dow : t('До')}</span>
        <BigDate date={date} />
        {when && <span className="ann7-when-note">{when}</span>}
      </div>
    );
  }

  if (kind === 'regular') {
    return (
      <div className="ann7-when">
        <span className="ann7-when-note">Каждую неделю</span>
        <span className="ann7-when-time">{item.regular.time}</span>
        <span className="ann7-when-weekday">{item.regular.weekday}</span>
      </div>
    );
  }

  return null;
}

// Сторис-карточка: сегменты прогресса, «Важно» и «Поделиться», заголовок, текст, место, ссылки и контакт слева,
// дата или связанное событие справа. Ссылка с primary — белой пилюлей, как контакт, остальные — обводкой.
function StoryCard({ item, segments, run, paused, onPrev, onNext, onShare, onHover }) {
  const where = placeOf(item);
  const links = item.details.filter((entry) => entry.type === 'link');
  const main = links.find((link) => link.primary);

  return (
    <div
      className={`ann7-story ${paused ? 'is-paused' : ''}`}
      style={{ '--ann7-ms': `${STORY_MS}ms` }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
    >
      <Megaphone className="ann7-megaphone" />

      <div className="ann7-segments" aria-hidden="true">
        {segments.map((state, i) => (
          // eslint-disable-next-line react/no-array-index-key -- сегменты — позиции в наборе, а не объявления
          <span key={i} className="ann7-segment">
            {state === 'done' && <span className="ann7-segment-fill is-done" />}
            {state === 'current' && <span key={run} className="ann7-segment-fill is-current" onAnimationEnd={onNext} />}
          </span>
        ))}
      </div>

      <div className="ann7-story-top">
        {item.important && <ImportantPill />}
        <button type="button" className="ann7-share" aria-label={t('Поделиться')} onClick={() => onShare(item)}>
          <ShareIcon size={19} />
        </button>
      </div>

      {/* Невидимые зоны нажатия: левее — предыдущее, правее — следующее */}
      <button type="button" className="ann7-tap is-prev" aria-label="Предыдущее объявление" onClick={onPrev} />
      <button type="button" className="ann7-tap is-next" aria-label="Следующее объявление" onClick={onNext} />

      <div key={item.id} className="ann7-story-main" aria-live="polite">
        <div className="ann7-story-text">
          <h2 className="ann7-story-title">{item.title}</h2>
          {item.body && <p className="ann7-story-body">{item.body}</p>}
          {where && (
            <span className="ann7-story-place">
              <PlaceIcon size={16} />
              {where}
            </span>
          )}
          {links.length > 0 && (
            <div className="ann7-story-links">
              {links.map((link) => (
                <a
                  key={link.url + link.text}
                  className={`ann7-story-link ${link === main ? 'is-main' : ''}`}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.text}
                  <span aria-hidden="true">↗</span>
                </a>
              ))}
            </div>
          )}
          {item.contact && (
            <a className="ann7-contact" href={item.contact.tel}>
              {/* Номер и имя одной строкой: «+7 921 000-12-34 · Анна» */}
              <span className="ann7-contact-text">
                {item.contact.name ? `${item.contact.phone} · ${item.contact.name}` : item.contact.phone}
              </span>
              <span className="ann7-contact-call"><PhoneIcon size={20} /></span>
            </a>
          )}
        </div>
        <div className="ann7-story-side">
          <StoryWhen item={item} />
        </div>
      </div>
    </div>
  );
}

// Десктоп страницы объявлений (макет design_handoff_announcements 2, вариант 7a): слева сторис со стопкой подложек —
// важные и последние объявления листаются сами по 7 секунд по кругу, справа список всех по дате публикации.
// Строка списка открывает объявление в сторис: из набора — листание продолжается с него, не из набора —
// оно «закреплено» (сегменты пустые, без таймера), а шаг вперёд или назад возвращает в набор.
// Прочитанным объявление становится, только когда на него нажали в списке, а не когда сторис дошли до него сами.
// initialId — объявление из ?a=, с которого начать; onRead(id) — отметить прочитанным.
export default function AnnouncementBoard({ items, initialId, readIds, onRead, onShare }) {
  const stories = storySet(items);
  const [state, setState] = useState(() => {
    const start = items.find((item) => String(item.id) === initialId) ?? stories[0];
    return { id: start.id, pinned: !stories.includes(start) };
  });
  // Счётчик показов: новый ключ перезапускает заливку сегмента, даже если объявление то же.
  const [run, setRun] = useState(0);
  const [hover, setHover] = useState(false);

  const current = items.find((item) => item.id === state.id) ?? stories[0];
  const position = state.pinned ? -1 : stories.indexOf(current);

  const show = (item, pinned = false) => {
    setState({ id: item.id, pinned });
    setRun((value) => value + 1);
  };

  // Шаг по набору сторис по кругу; из закреплённого — к первому или последнему.
  const step = (delta) => {
    const count = stories.length;
    const next = position < 0 ? (delta > 0 ? 0 : count - 1) : (position + delta + count) % count;
    show(stories[next]);
  };

  const segments = stories.map((_, i) => (i < position ? 'done' : i === position ? 'current' : 'empty'));

  return (
    <div className="ann7-board">
      <div className="ann7-stage">
        <StoryCard
          item={current}
          segments={segments}
          run={run}
          paused={hover}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
          onShare={onShare}
          onHover={setHover}
        />
        <span className="ann7-layer is-first" aria-hidden="true" />
        <span className="ann7-layer is-second" aria-hidden="true" />
      </div>

      <div className="ann7-list">
        {items.map((item) => {
          const id = String(item.id);
          const active = item === current;
          return (
            <AnnouncementRow
              key={item.id}
              item={item}
              active={active}
              read={!active && readIds.includes(id)}
              unread={!readIds.includes(id)}
              onOpen={() => {
                onRead(id);
                if (!active) show(item, !stories.includes(item));
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
