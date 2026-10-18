import { useEffect, useId, useRef, useState } from 'react';
import { useAnnouncements } from '../api/announcements.js';
import { t } from '../i18n.js';
import './Announcements.css';

// Какие объявления посетитель уже видел: их id хранятся в браузере. Новое
// объявление (id нет в списке) зажигает красную точку у счётчика.
const SEEN_KEY = 'announcements:seen';

function readSeen() {
  try {
    const ids = JSON.parse(localStorage.getItem(SEEN_KEY));
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

function writeSeen(ids) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(ids));
  } catch {
    // Хранилище недоступно (приватный режим) — точка просто погаснет до перезагрузки.
  }
}

function AnnouncementList({ announcements }) {
  return (
    <ul className="announcements-list">
      {announcements.map((item) => (
        <li key={item.id} className="announcements-item">
          <div className="announcements-item-title">{item.title}</div>
          {item.body && <p className="announcements-item-body">{item.body}</p>}
        </li>
      ))}
    </ul>
  );
}

// Блок объявлений на главной: строка с первым заголовком. По нажатию на телефоне
// список раскрывается внутри блока, а в десктопной сетке (popup) — открывается
// во всплывающем окне, чтобы не растягивать колонку. Объявления ведутся в админке.
export default function Announcements({ className = '', popup = false }) {
  const announcements = useAnnouncements();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(readSeen);
  const dialogRef = useRef(null);
  const panelId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!popup || !dialog) return undefined;

    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();

    // Пока окно открыто, страница под ним не прокручивается.
    document.documentElement.style.overflow = open ? 'hidden' : '';
    return () => { document.documentElement.style.overflow = ''; };
  }, [popup, open, announcements.length]);

  if (announcements.length === 0) return null;

  const inlineOpen = open && !popup;
  const hasUnread = announcements.some((item) => !seen.includes(item.id));

  const toggle = () => {
    if (!open && hasUnread) {
      // Храним только текущие id, чтобы список не рос со снятыми объявлениями.
      const ids = announcements.map((item) => item.id);
      writeSeen(ids);
      setSeen(ids);
    }
    setOpen(!open);
  };

  return (
    <section className={`announcements ${inlineOpen ? 'is-open' : ''} ${className}`}>
      <button
        type="button"
        className="announcements-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup={popup ? 'dialog' : undefined}
        onClick={toggle}
      >
        <span className="announcements-head">
          <span className="announcements-label">
            {t('Объявления')}
            <span className="announcements-count">
              {announcements.length}
              {hasUnread && <span className="announcements-unread" role="img" aria-label={t('Есть новые')} />}
            </span>
          </span>
          {!inlineOpen && <span className="announcements-preview">{announcements[0].title}</span>}
        </span>
        <span className="announcements-knob" aria-hidden="true">
          {popup ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 18 18 6M8 6h10v10" />
            </svg>
          ) : (
            <svg className="announcements-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          )}
        </span>
      </button>

      {popup ? (
        <dialog
          id={panelId}
          ref={dialogRef}
          className="announcements-dialog"
          aria-labelledby={`${panelId}-title`}
          onClose={() => setOpen(false)}
          // Нажатие на затемнение вокруг окна закрывает его.
          onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}
        >
          <div className="announcements-dialog-inner">
            <div className="announcements-dialog-head">
              <h2 id={`${panelId}-title`} className="h-display announcements-dialog-title">{t('Объявления')}</h2>
              <button type="button" className="announcements-knob announcements-close" aria-label={t('Закрыть')} onClick={() => setOpen(false)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </button>
            </div>
            <AnnouncementList announcements={announcements} />
          </div>
        </dialog>
      ) : (
        <div id={panelId} className="announcements-panel" hidden={!open}>
          <AnnouncementList announcements={announcements} />
        </div>
      )}
    </section>
  );
}
