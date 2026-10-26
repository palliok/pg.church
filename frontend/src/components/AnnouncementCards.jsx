import { t } from '../i18n.js';
import { PhoneIcon, PlaceIcon, ShareIcon } from './Icons.jsx';
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

// Дата на чёрной карточке: подпись сверху («Вт», «До»), под ней число и месяц.
export function DatePart({ label, date }) {
  return (
    <span className="ann-date">
      <span className="ann-date-label">{label}</span>
      <span className="ann-date-day">
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
      {item.deadline && <DatePart label={t('До')} date={item.deadline} />}
      {item.eventDate && <DatePart label={item.eventDate.dow} date={item.eventDate} />}
      {item.eventEnd && (
        <>
          <span className="ann-dates-arrow"><LongArrow width={44} stroke={2.2} /></span>
          <DatePart label={item.eventEnd.dow} date={item.eventEnd} />
        </>
      )}
      {item.days && <span className="ann-pill">{item.days}</span>}
      {when && <span className="ann-pill">{when.text}</span>}
    </div>
  );
}

// Открытое объявление — чёрная карточка: «Важно», заголовок, текст, дата, место, ссылки,
// телефон с именем и «Поделиться». fromLink — пришли по ссылке ?a=.
export function AnnouncementCard({ item, fromLink = false, onShare, className = '' }) {
  const where = item.details.find((detail) => detail.type === 'where');
  const links = item.details.filter((detail) => detail.type === 'link');
  const hasDates = Boolean(item.deadline || item.eventDate || item.details.some((detail) => detail.type === 'when'));

  // Блоки карточки по порядку; последний встаёт в один ряд с «Поделиться».
  const blocks = [
    <div key="head" className="ann-card-head">
      {(item.important || fromLink) && (
        <div className="ann-card-marks">
          {item.important && <ImportantPill />}
          {fromLink && <span className="ann-card-badge">по ссылке</span>}
        </div>
      )}
      <h2 className="ann-card-title">{item.title}</h2>
    </div>,
    item.body && <p key="body" className="ann-card-body">{item.body}</p>,
    hasDates && <AnnouncementDates key="dates" item={item} withWhen />,
    where && (
      <span key="where" className="ann-card-place">
        <PlaceIcon size={15} />
        <span>{where.text}</span>
      </span>
    ),
    links.length > 0 && (
      <div key="links" className="ann-card-links">
        {links.map((link) => (
          <a key={link.url + link.text} className="ann-card-link" href={link.url} target="_blank" rel="noopener noreferrer">
            {link.text}
            <LongArrow />
          </a>
        ))}
      </div>
    ),
    item.contact && (
      <a key="call" className="ann-card-call" href={item.contact.tel}>
        <PhoneIcon />
        <span className="ann-card-phone">{item.contact.phone}</span>
        {item.contact.name && <span className="ann-card-name">{item.contact.name}</span>}
      </a>
    ),
  ].filter(Boolean);
  const last = blocks.pop();

  return (
    <article className={`ann-card ${className}`}>
      <Megaphone />
      {blocks}
      {/* «Поделиться» — справа от последней строки и не делает её выше. */}
      <div className="ann-card-last">
        {last}
        <button type="button" className="ann-card-share" aria-label={t('Поделиться')} onClick={() => onShare(item)}>
          <ShareIcon size={18} />
        </button>
      </div>
    </article>
  );
}
