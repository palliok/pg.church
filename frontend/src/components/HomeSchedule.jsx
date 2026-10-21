import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { getLang, t } from '../i18n.js';
import { daysFromToday, monthLabel, relativeDay, startsIn } from '../api/dates.js';
import { EventTag, LiveTag } from './EventVisuals.jsx';
import './HomeSchedule.css';

// Высота строки списка, меньше которой строки не сжимаются: по ней считаем, сколько их влезает.
const ROW_MIN = 58;

// Блок «Расписание» на главной (десктоп, макет resources/design_handoff_schedule_2b): голубая карточка
// ближайшего события, под ней следующие строками — столько, сколько влезает целиком, внизу «Всё расписание».
// events — ближайшие события по порядку, now — текущее время (от него «через 3 ч»).
export default function HomeSchedule({ events, loading, error, now, className = '' }) {
  const listRef = useRef(null);
  const rows = useFitCount(listRef, ROW_MIN);
  const [next, ...rest] = events;

  return (
    <div className={`home-sched ${className}`}>
      {next && <NextCard event={next} now={now} />}

      <div className="home-sched-list" ref={listRef}>
        {rest.slice(0, rows).map((e) => (
          <Link key={e.id} to={`/schedule/${e.id}`} className="home-sched-item">
            <span className="home-sched-date">
              <span className="home-sched-date-num">{e.day}</span>
              <span className="home-sched-date-dow">{e.dowShort}</span>
            </span>
            <span className="home-sched-item-title">
              {e.live && <span className="home-sched-live" role="img" aria-label={t('Эфир')} />}
              <span className="home-sched-item-name">{e.title}</span>
            </span>
            <span className="home-sched-item-time">{e.timeLabel ?? t('Весь день')}</span>
          </Link>
        ))}
        {!next && !loading && !error && <div className="home-sched-note">Ближайших событий нет.</div>}
        {error && <div role="alert" className="home-sched-note">Не удалось загрузить данные.</div>}
      </div>

      <Link to="/schedule" className="home-sched-all">
        Всё расписание
        <span aria-hidden="true">→</span>
      </Link>
    </div>
  );
}

// Ближайшее событие: на фоне — число дня; сверху «Сегодня · через 3 ч», внизу место и стрелка.
function NextCard({ event: e, now }) {
  const label = [relativeDay(e), startsIn(e, { now })].filter(Boolean).join(' · ');

  return (
    <Link to={`/schedule/${e.id}`} className="home-sched-next">
      <span className="home-sched-next-mark" aria-hidden="true">{e.day}</span>
      <span className="home-sched-next-label">{label}</span>
      <span className="home-sched-next-time">{e.timeLabel ?? t('Весь день')}</span>
      <span className="home-sched-next-title">{e.title}</span>
      <span className="home-sched-next-foot">
        <span className="home-sched-next-place">{e.place}</span>
        <span className="home-sched-next-knob" aria-hidden="true">↗</span>
      </span>
    </Link>
  );
}

// Расписание на мобильной главной (макет «Главная · мобилка»): карусель событий на неделю вперёд
// и в конце карточка «В календарь». Сегодняшнее событие — тёмная карточка, с эфиром — голубая,
// остальные — белые с обводкой.
export function ScheduleCarousel({ events, now }) {
  return (
    <div className="home-carousel hide-scrollbar">
      {events.map((e) => <CarouselCard key={e.id} event={e} now={now} />)}
      <Link to="/schedule" className="home-carousel-card is-more">
        <span className="home-carousel-label">Дальше</span>
        <span className="home-carousel-bottom">
          <span className="home-carousel-title">{moreTitle()}</span>
          <span className="home-carousel-more-sub">Все события месяца</span>
          <span className="home-carousel-foot">
            <span />
            <span className="home-carousel-knob" aria-hidden="true">↗</span>
          </span>
        </span>
      </Link>
    </div>
  );
}

// Заголовок последней карточки. Ключ «В календарь» в словаре уже переведён как «Add to calendar»
// (кнопка на странице события), а здесь это переход к расписанию — на en и ky берём «Всё расписание».
function moreTitle() {
  return getLang() === 'ru' ? 'В календарь' : t('Всё расписание');
}

// День недели рядом со временем; сегодня и завтра — словами.
function weekdayLabel(event, today) {
  if (today) return t('Сегодня');
  return daysFromToday(event) === 1 ? t('Завтра') : event.dowLabel;
}

// Карточка события: число и месяц сверху, внизу название, время с днём недели, место.
function CarouselCard({ event: e, now }) {
  const today = daysFromToday(e) === 0;
  const soon = today ? startsIn(e, { now }) : null;
  const tone = today ? 'is-today' : e.live ? 'is-live' : '';

  return (
    <Link to={`/schedule/${e.id}`} className={`home-carousel-card ${tone}`}>
      <span className="home-carousel-top">
        <span className="home-carousel-date">
          <span className="home-carousel-num">{e.day}</span>
          <span className="home-carousel-label">{monthLabel(e)}</span>
        </span>
        <span className="home-carousel-badges">
          {e.live && <LiveTag />}
          {soon && <span className="home-carousel-soon">{soon}</span>}
        </span>
      </span>
      <span className="home-carousel-bottom">
        <span className="home-carousel-title">{e.title}</span>
        <span className="home-carousel-when">
          <span className="home-carousel-time">{e.timeLabel ?? t('Весь день')}</span>
          <span className="home-carousel-label">{weekdayLabel(e, today)}</span>
        </span>
        <span className="home-carousel-foot">
          {e.place ? <EventTag>{e.place}</EventTag> : <span />}
          <span className="home-carousel-knob" aria-hidden="true">↗</span>
        </span>
      </span>
    </Link>
  );
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
