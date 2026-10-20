import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { getLang, t } from '../i18n.js';
import { daysFromToday, relativeDay, startsIn } from '../api/dates.js';
import { themeVars } from '../eventTheme.js';
import CalendarOptions from './CalendarOptions.jsx';
import { EventChip, EventWatermark, LiveBadge, LiveDot } from './EventVisuals.jsx';
import './HomeSchedule.css';

// Высота строки списка, меньше которой строки не сжимаются: по ней считаем, сколько их влезает.
const ROW_MIN = 52;

// Блок «Расписание» на главной (десктоп, макет resources/design_handoff_schedule): карточка ближайшего
// события и под ней следующие строками — столько, сколько влезает целиком; строки делят высоту поровну.
// events — ближайшие события по порядку, now — текущее время (от него «через 3 часа»).
export default function HomeSchedule({ events, loading, error, now, className = '' }) {
  const listRef = useRef(null);
  const rows = useFitCount(listRef, ROW_MIN);
  const [next, ...rest] = events;

  return (
    <div className={`home-sched ${className}`}>
      <div className="home-sched-head">
        <div className="h-display home-sched-heading">Расписание</div>
        <Link to="/schedule" className="home-sched-all">
          Всё
          <span className="home-sched-all-knob" aria-hidden="true">↗</span>
        </Link>
      </div>

      {next && <NextCard event={next} now={now} />}

      <div className="home-sched-list" ref={listRef}>
        {rest.slice(0, rows).map((e) => (
          <Link key={e.id} to={`/schedule/${e.id}`} className="home-sched-item">
            <span className="home-sched-date" style={themeVars(e)}>
              <span className="home-sched-date-num">{e.day}</span>
              <span className="home-sched-date-dow">{e.dowShort}</span>
            </span>
            <span className="home-sched-item-title">
              <span className="home-sched-item-name">{e.title}</span>
              {e.live && <LiveDot />}
            </span>
            <span className="home-sched-item-time">{e.timeLabel ?? t('Весь день')}</span>
          </Link>
        ))}
        {!next && !loading && !error && <div className="home-sched-note">Ближайших событий нет.</div>}
        {error && <div role="alert" className="home-sched-note">Не удалось загрузить данные.</div>}
      </div>
    </div>
  );
}

// Ближайшее событие: день относительно сегодня — один раз, в плашке; справа — сколько осталось до начала.
function NextCard({ event: e, now }) {
  const soon = startsIn(e, { now });

  return (
    <Link to={`/schedule/${e.id}`} className="home-sched-next" style={themeVars(e)}>
      <EventWatermark event={e} />
      <div className="home-sched-next-top">
        <EventChip>{relativeDay(e)}</EventChip>
        {soon && <span className="home-sched-next-soon">{soon}</span>}
      </div>
      <div className="home-sched-next-bottom">
        <div className="home-sched-next-time">{e.timeLabel ?? t('Весь день')}</div>
        <div className="home-sched-next-foot">
          <div style={{ minWidth: 0 }}>
            <div className="home-sched-next-title">{e.title}</div>
            {e.place && <div className="home-sched-next-place">{e.place}</div>}
          </div>
          <span className="home-sched-next-knob" aria-hidden="true">↗</span>
        </div>
      </div>
    </Link>
  );
}

// Расписание на мобильной главной: карусель событий на неделю вперёд и в конце карточка «В календарь».
// Кнопка «+» на карточке открывает шторку «Добавить в календарь».
export function ScheduleCarousel({ events, now }) {
  const [calendarEvent, setCalendarEvent] = useState(null);

  return (
    <>
      <div className="home-carousel hide-scrollbar">
        {events.map((e) => (
          <CarouselCard key={e.id} event={e} now={now} onCalendar={() => setCalendarEvent(e)} />
        ))}
        <Link to="/schedule" className="home-carousel-card home-carousel-more">
          <EventChip tone="white">Дальше</EventChip>
          <div className="home-carousel-more-bottom">
            <span className="home-carousel-more-knob" aria-hidden="true">↗</span>
            <div>
              <div className="home-carousel-more-title">{moreTitle()}</div>
              <div className="home-carousel-more-sub">Все события месяца</div>
            </div>
          </div>
        </Link>
      </div>
      {calendarEvent && <CalendarSheet event={calendarEvent} onClose={() => setCalendarEvent(null)} />}
    </>
  );
}

// Карточка карусели. Нажатие в любом месте открывает событие: под содержимым — ссылка на всю карточку
// (для мыши и пальца, с клавиатуры — «Подробнее»); «+» — добавить в календарь.
function CarouselCard({ event: e, now, onCalendar }) {
  const soon = daysFromToday(e) === 0 ? startsIn(e, { short: true, now }) : null;

  return (
    <div className="home-carousel-card" style={themeVars(e)}>
      <Link to={`/schedule/${e.id}`} className="home-carousel-hit" tabIndex={-1} aria-hidden="true" />
      <EventWatermark event={e} />
      <div className="home-carousel-top">
        <EventChip>{[relativeDay(e), soon].filter(Boolean).join(' · ')}</EventChip>
        {e.live && <LiveBadge />}
      </div>
      <div className="home-carousel-bottom">
        <div className="home-carousel-time">{e.timeLabel ?? t('Весь день')}</div>
        <div className="home-carousel-title" id={`carousel-${e.id}`}>{e.title}</div>
        {e.place && <div className="home-carousel-place">{e.place}</div>}
        <div className="home-carousel-actions">
          {/* Одинаковые «Подробнее» и «+» на каждой карточке — программа чтения экрана добавит к ним название. */}
          <Link to={`/schedule/${e.id}`} className="home-carousel-open" aria-describedby={`carousel-${e.id}`}>Подробнее</Link>
          <button type="button" className="home-carousel-add" onClick={onCalendar} aria-label="Добавить в календарь" aria-describedby={`carousel-${e.id}`}>+</button>
        </div>
      </div>
    </div>
  );
}

// Шторка снизу: добавить событие в Google, Outlook или файлом .ics. Закрывается фоном, кнопкой и клавишей Esc;
// фокус при открытии переходит в шторку, после закрытия возвращается на «+».
function CalendarSheet({ event, onClose }) {
  const panelRef = useRef(null);

  useEffect(() => {
    const overflow = document.body.style.overflow;
    const opener = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
      opener?.focus?.();
    };
  }, [onClose]);

  return createPortal(
    <div className="cal-sheet">
      <div className="cal-sheet-backdrop" onClick={onClose} />
      <div className="cal-sheet-panel" role="dialog" aria-modal="true" aria-labelledby="cal-sheet-title" tabIndex={-1} ref={panelRef}>
        <div className="cal-sheet-handle" aria-hidden="true" />
        <div className="cal-sheet-head">
          <div id="cal-sheet-title" className="cal-sheet-title">Добавить в календарь</div>
          <button type="button" className="cal-sheet-close" onClick={onClose} aria-label="Закрыть">✕</button>
        </div>
        <div className="cal-sheet-event">{[event.title, event.dateLabel, event.timeLabel].filter(Boolean).join(' · ')}</div>
        <CalendarOptions
          options={[
            { label: t('Google Календарь'), href: event.calendar.google, external: true },
            { label: 'Outlook', href: event.calendar.outlook, external: true },
            { label: t('Apple, Яндекс и другие'), hint: t('файл .ics'), href: event.calendar.ics },
          ]}
        />
      </div>
    </div>,
    document.body,
  );
}

// Заголовок последней карточки карусели. Ключ «В календарь» в словаре уже переведён как «Add to calendar»
// (кнопка на странице события), а здесь это переход к расписанию — на en и ky берём «Всё расписание».
function moreTitle() {
  return getLang() === 'ru' ? 'В календарь' : t('Всё расписание');
}

// Сколько строк высотой не меньше rowMin помещается в элемент; пересчитывается при изменении его размера.
function useFitCount(ref, rowMin) {
  const [count, setCount] = useState(4);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const observer = new ResizeObserver(([entry]) => setCount(Math.max(1, Math.floor(entry.contentRect.height / rowMin))));
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rowMin]);

  return count;
}
