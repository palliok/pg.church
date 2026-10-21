import { Link } from 'react-router-dom';
import { getLang, t } from '../i18n.js';
import { daysFromToday, startsIn } from '../api/dates.js';
import { EventTag, LiveTag } from './EventVisuals.jsx';
import { PlaceIcon } from './Icons.jsx';
import LongArrow from './LongArrow.jsx';
import './HomeSchedule.css';

// Строк в списке с запасом: сколько из них видно, решает высота блока, остальные уходят под кнопку.
const LIST_LIMIT = 8;

// Блок «Расписание» на главной (десктоп, макет design_handoff_overview, блок 04): тёмная карточка
// ближайшего события, под ней следующие строками; список обрезается кнопкой «Всё расписание»
// и растворяется под ней — видно, что событий дальше больше.
// events — ближайшие события по порядку, now — текущее время (от него «через 3 ч»).
export default function HomeSchedule({ events, loading, error, now, className = '' }) {
  const [next, ...rest] = events;

  return (
    <div className={`home-sched ${className}`}>
      {next && <NextCard event={next} now={now} />}

      <div className="home-sched-list">
        {rest.slice(0, LIST_LIMIT).map((e) => (
          <Link key={e.id} to={`/schedule/${e.id}`} className="home-sched-item">
            <span className="home-sched-date">
              <span className="home-sched-date-num">{e.day}</span>
              <span className="home-sched-date-mon">{e.mon}</span>
            </span>
            <span className="home-sched-item-body">
              <span className="home-sched-item-name">{e.title}</span>
              <span className="home-sched-item-time">{e.timeLabel ?? t('Весь день')}</span>
              {e.place && (
                <span className="home-sched-item-place">
                  <PlaceIcon size={13} />
                  <span>{e.place}</span>
                </span>
              )}
            </span>
            <LongArrow width={28} stroke={2.6} />
          </Link>
        ))}
        {!next && !loading && !error && <div className="home-sched-note">Ближайших событий нет.</div>}
        {error && <div role="alert" className="home-sched-note">Не удалось загрузить данные.</div>}
      </div>

      <Link to="/schedule" className="home-sched-all">Всё расписание</Link>
    </div>
  );
}

// Ближайшее событие: на фоне — число дня; сверху «Ближайшее · завтра · через 22 ч», название, время,
// внизу место и стрелка.
function NextCard({ event: e, now }) {
  const label = [t('Ближайшее'), dayWord(e) ?? `${e.day} ${e.mon}`, startsIn(e, { now })].filter(Boolean).join(' · ');

  return (
    <Link to={`/schedule/${e.id}`} className="home-sched-next">
      <span className="home-sched-next-mark" aria-hidden="true">{e.day}</span>
      <span className="home-sched-next-label">{label}</span>
      <span className="home-sched-next-title">{e.title}</span>
      <span className="home-sched-next-time">{e.timeRange}</span>
      <span className="home-sched-next-foot">
        {e.place ? (
          <span className="home-sched-next-place">
            <PlaceIcon />
            <span>{e.place}</span>
          </span>
        ) : <span />}
        <LongArrow width={28} stroke={2.6} />
      </span>
    </Link>
  );
}

// «Сегодня» или «Завтра»; для остальных дней — null.
function dayWord(event) {
  const days = daysFromToday(event);
  if (days === 0) return t('Сегодня');
  return days === 1 ? t('Завтра') : null;
}

// Расписание на мобильной главной (макет design_handoff_overview, блок 05): карусель событий на неделю вперёд
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

// Карточка события: сверху число и день недели («Чт · Сегодня»), внизу время, название и место.
function CarouselCard({ event: e, now }) {
  const today = daysFromToday(e) === 0;
  const soon = today ? startsIn(e, { now }) : null;
  const tone = today ? 'is-today' : e.live ? 'is-live' : '';

  return (
    <Link to={`/schedule/${e.id}`} className={`home-carousel-card ${tone}`}>
      <span className="home-carousel-top">
        <span className="home-carousel-date">
          <span className="home-carousel-num">{e.day}</span>
          <span className="home-carousel-label">{[e.dowShort, dayWord(e)].filter(Boolean).join(' · ')}</span>
        </span>
        <span className="home-carousel-badges">
          {e.live && <LiveTag />}
          {soon && <span className="home-carousel-soon">{soon}</span>}
        </span>
      </span>
      <span className="home-carousel-bottom">
        <span className="home-carousel-time">{e.timeLabel ?? t('Весь день')}</span>
        <span className="home-carousel-title">{e.title}</span>
        <span className="home-carousel-foot">
          {e.place ? <EventTag>{e.place}</EventTag> : <span />}
          <span className="home-carousel-knob" aria-hidden="true">↗</span>
        </span>
      </span>
    </Link>
  );
}
