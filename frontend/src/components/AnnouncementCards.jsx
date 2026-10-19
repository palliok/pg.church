import { useId, useState } from 'react';
import { t } from '../i18n.js';
import './Announcements.css';

const ICONS = {
  when: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  where: (
    <>
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  phone: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
};

function DetailIcon({ name }) {
  return (
    <span className={`ann-detail-icon ${name === 'phone' ? 'is-phone' : ''}`} aria-hidden="true">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {ICONS[name]}
      </svg>
    </span>
  );
}

// Строки «Когда», «Где» и «Контакт» — только для заполненных полей.
// Строка телефона целиком — ссылка tel:.
function DetailRows({ item }) {
  const { when, where, contact } = item;
  if (!when && !where && !contact) return null;

  return (
    <div className="ann-details">
      {when && (
        <div className="ann-detail">
          <DetailIcon name="when" />
          <span className="ann-detail-text">
            <span className="ann-detail-label">{t('Когда')}</span>
            <span className="ann-detail-value">{when}</span>
          </span>
        </div>
      )}
      {where && (
        <div className="ann-detail">
          <DetailIcon name="where" />
          <span className="ann-detail-text">
            <span className="ann-detail-label">{t('Где')}</span>
            <span className="ann-detail-value">{where}</span>
          </span>
        </div>
      )}
      {contact && (
        <a className="ann-detail" href={contact.tel}>
          <DetailIcon name="phone" />
          <span className="ann-detail-text">
            <span className="ann-detail-label">{[t('Контакт'), contact.name].filter(Boolean).join(' · ')}</span>
            <span className="ann-detail-phone">{contact.phone}</span>
          </span>
        </a>
      )}
    </div>
  );
}

// Действующее объявление — тёмная карточка: дата, заголовок, текст и детали внизу.
export function AnnouncementCard({ item }) {
  return (
    <article className="ann-card">
      {item.dateLabel && <span className="ann-card-date">{item.dateLabel}</span>}
      <h3 className="ann-card-title">{item.title}</h3>
      {item.body && <p className="ann-card-body">{item.body}</p>}
      <DetailRows item={item} />
    </article>
  );
}

// Прошедшее объявление — плашка с датой и заголовком, по нажатию раскрывается.
// Каждая плашка раскрывается сама по себе, открытыми могут быть несколько.
export function PastAnnouncement({ item }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className={`ann-past ${open ? 'is-open' : ''}`}>
      <button type="button" className="ann-past-toggle" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(!open)}>
        {item.day && (
          <span className="ann-past-date">
            <span className="ann-past-day">{item.day}</span>
            <span className="ann-past-mon">{item.mon}</span>
          </span>
        )}
        <span className="ann-past-title">{item.title}</span>
        <span className="ann-past-plus" aria-hidden="true">+</span>
      </button>
      <div id={panelId} className="ann-past-panel" hidden={!open}>
        {item.body && <p className="ann-past-body">{item.body}</p>}
        <DetailRows item={item} />
      </div>
    </div>
  );
}
