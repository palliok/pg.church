import { t } from '../i18n.js';
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

const FACT_ICONS = {
  when: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ),
  where: (
    <>
      <path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z" />
      <circle cx="12" cy="9" r="2.5" />
    </>
  ),
  link: <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />,
};

// Строка деталей с иконкой в кружке; ссылка открывается в новой вкладке.
function Fact({ detail }) {
  const content = (
    <>
      <span className="ann-fact-icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {FACT_ICONS[detail.type]}
        </svg>
      </span>
      <span className="ann-fact-text">{detail.text}</span>
      {detail.type === 'link' && <span className="ann-fact-arrow" aria-hidden="true">↗</span>}
    </>
  );

  return detail.type === 'link'
    ? <a className="ann-fact is-link" href={detail.url} target="_blank" rel="noopener noreferrer">{content}</a>
    : <div className="ann-fact">{content}</div>;
}

// Открытое объявление — чёрная карточка: день события (если назначен) и пометки, заголовок, текст,
// «когда», «где» и ссылки, кнопка звонка и «Поделиться». fromLink — пришли по ссылке ?a=.
export function AnnouncementCard({ item, fromLink = false, onShare, className = '' }) {
  return (
    <article className={`ann-card ${item.contact ? '' : 'no-call'} ${className}`}>
      <Megaphone />
      <div className="ann-card-meta">
        {item.eventDate && <span className="ann-card-date">{item.eventDate.label}</span>}
        {item.important && <ImportantPill />}
        {fromLink && <span className="ann-card-badge">по ссылке</span>}
      </div>
      <h2 className="ann-card-title">{item.title}</h2>
      {item.body && <p className="ann-card-body">{item.body}</p>}
      {item.details.length > 0 && (
        <div className="ann-facts">
          {item.details.map((detail, index) => <Fact key={index} detail={detail} />)}
        </div>
      )}
      {item.contact && (
        <a className="ann-card-call" href={item.contact.tel} title={item.contact.name ?? undefined}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A18 18 0 0 1 3 5a2 2 0 0 1 2-2z" />
          </svg>
          {item.contact.phone}
        </a>
      )}
      {/* «Поделиться» всегда в правом нижнем углу, на одной линии с последней строкой. */}
      <button type="button" className="ann-card-share" aria-label={t('Поделиться')} onClick={() => onShare(item)}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 15V3M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
        </svg>
      </button>
    </article>
  );
}
