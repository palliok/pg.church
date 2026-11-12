import { Link } from 'react-router-dom';
import { PlaceIcon } from './Icons.jsx';
import LongArrow from './LongArrow.jsx';
import './Announcements.css';

// Рупор — водяной знак на чёрных карточках объявлений.
export function Megaphone({ className }) {
  return (
    <span className={`ann-megaphone ${className ?? ''}`} aria-hidden="true">
      <svg viewBox="0 0 24 24">
        <path d="M3 9h5l11-5.5v17L8 15H3a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z" fill="#fff" />
        <ellipse cx="19" cy="12" rx="2.2" ry="8.4" fill="#231f20" stroke="#fff" strokeWidth="1.6" />
        <path d="M5 15l1.6 5.2h2.8L8.2 15" fill="#fff" />
      </svg>
    </span>
  );
}

export function ImportantPill() {
  return <span className="ann-important">Важно</span>;
}

// Дата на чёрной карточке: число и месяц, у срока перед числом — «До». День недели не пишем.
export function DatePart({ date, until = false }) {
  return (
    <span className="ann-date">
      <span className="ann-date-day">
        {until && <span className="ann-date-until">До</span>}
        <span className="ann-date-num">{date.day}</span>
        <span className="ann-date-mon">{date.mon}</span>
      </span>
    </span>
  );
}

// Когда (макет design_handoff_overview, блок 12): срок «до 30 июн», один день или «14 июл → 20 июл · 7 дней»;
// рядом белой пилюлей — время или пояснение («С 10:00», «После служений»), если withWhen.
// Без даты и пояснения ничего не выводит.
export function AnnouncementDates({ item, withWhen = false }) {
  const when = withWhen ? item.details.find((detail) => detail.type === 'when') : null;
  if (!item.deadline && !item.eventDate && !when) return null;

  return (
    <div className="ann-dates">
      {item.deadline && <DatePart until date={item.deadline} />}
      {item.eventDate && <DatePart date={item.eventDate} />}
      {item.eventEnd && (
        <>
          <span className="ann-dates-arrow"><LongArrow width={44} stroke={2.2} /></span>
          <DatePart date={item.eventEnd} />
        </>
      )}
      {item.days && <span className="ann-pill">{item.days}</span>}
      {when && <span className="ann-pill">{when.text}</span>}
    </div>
  );
}

// Связанное событие — белая карточка: плашка даты (число и месяц), название, время и место; ведёт на страницу события.
// Что это расписание, понятно по ссылке внизу, поэтому отдельной подписи сверху нет.
// compact — для сторис на телефоне: те же плитка даты, название, время и место, что на десктопе, но без нижней строки —
// ссылку обозначает стрелка справа.
export function LinkedEvent({ event, compact = false, className = '' }) {
  if (compact) {
    return (
      <Link to={`/schedule/${event.id}`} className={`ann-event is-compact ${className}`}>
        <span className="ann-event-tile">
          <span className="ann-event-day">{event.day}</span>
          <span className="ann-event-mon">{event.mon}</span>
        </span>
        <span className="ann-event-text">
          <span className="ann-event-title">{event.title}</span>
          <span className="ann-event-time">{event.timeRange}</span>
          {event.place && (
            <span className="ann-event-place">
              <PlaceIcon size={13} />
              {event.place}
            </span>
          )}
        </span>
        <LongArrow width={22} stroke={2.2} />
      </Link>
    );
  }

  return (
    <Link to={`/schedule/${event.id}`} className={`ann-event ${className}`}>
      <span className="ann-event-body">
        <span className="ann-event-tile">
          <span className="ann-event-day">{event.day}</span>
          <span className="ann-event-mon">{event.mon}</span>
        </span>
        <span className="ann-event-text">
          <span className="ann-event-title">{event.title}</span>
          <span className="ann-event-time">{event.timeRange}</span>
          {event.place && (
            <span className="ann-event-place">
              <PlaceIcon size={14} />
              {event.place}
            </span>
          )}
        </span>
      </span>
      <span className="ann-event-foot">
        <span>Открыть в расписании</span>
        <LongArrow width={28} stroke={2.6} />
      </span>
    </Link>
  );
}
