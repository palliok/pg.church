import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import PlatformIcon from './PlatformIcon.jsx';
import './LiveModal.css';

// Насколько нужно смахнуть шторку вверх, чтобы она закрылась.
const SWIPE_CLOSE = 60;

// Ссылка на площадку открывается в новой вкладке (или в приложении площадки), модалка закрывается.
function linkProps(link, onClose) {
  return { href: link.url, target: '_blank', rel: 'noreferrer', onClick: onClose };
}

// Модалка «Смотреть трансляцию» (макет L13 / L13D): тёмная шторка сверху — на телефоне
// во всю ширину, чтобы не тянуться пальцем вниз, на десктопе — панель 620px по центру.
// Несколько площадок — плитками, одна — широкой строкой; ниже — трансляция с сурдопереводом, если она есть.
export default function LiveModal({ live, onClose }) {
  const closeRef = useRef(null);
  const touchY = useRef(null);
  const { links, signLink } = live;

  // Esc закрывает, страница под модалкой не прокручивается, фокус — на кнопке «Закрыть»
  // и после закрытия возвращается туда, где был (на кнопку «Смотреть»).
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  const onTouchStart = (event) => { touchY.current = event.touches[0].clientY; };
  const onTouchEnd = (event) => {
    if (touchY.current != null && touchY.current - event.changedTouches[0].clientY > SWIPE_CLOSE) onClose();
    touchY.current = null;
  };

  return createPortal(
    <div className="live-modal">
      <div className="live-modal-backdrop" onClick={onClose} />
      <div
        className="live-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="live-modal-title"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="live-modal-head">
          <span className="live-modal-badge">
            <span className="live-dot" />
            В эфире
          </span>
          <button ref={closeRef} type="button" className="live-modal-close" onClick={onClose} aria-label="Закрыть">✕</button>
        </div>

        <h2 id="live-modal-title" className="live-modal-title">Идёт богослужение</h2>
        <p className="live-modal-sub">Выберите, где смотреть</p>

        {links.length > 1 && (
          <div className="live-modal-grid" style={{ '--cols': Math.min(links.length, 3) }}>
            {links.map((link) => (
              <a key={link.url} className="live-tile" {...linkProps(link, onClose)}>
                <PlatformIcon platform={link.platform} name={link.name} />
                <span className="live-tile-name">{link.name}</span>
              </a>
            ))}
          </div>
        )}

        {links.length === 1 && (
          <a className="live-row" {...linkProps(links[0], onClose)}>
            <PlatformIcon platform={links[0].platform} name={links[0].name} />
            <span className="live-row-text">
              <span className="live-row-name">{links[0].name}</span>
              <span className="live-row-note">Прямой эфир</span>
            </span>
            <span className="live-row-go" aria-hidden="true">↗</span>
          </a>
        )}

        {signLink && (
          <>
            <div className="live-modal-section">С сурдопереводом</div>
            <a className="live-row live-row--sign" {...linkProps(signLink, onClose)}>
              <PlatformIcon platform={signLink.platform} name={signLink.name} />
              <span className="live-row-text">
                <span className="live-row-name">{signLink.name}</span>
                <span className="live-row-note">Переводчик жестового языка в кадре</span>
              </span>
              <span className="live-row-go" aria-hidden="true">↗</span>
            </a>
          </>
        )}

        <div className="live-modal-handle" aria-hidden="true" />
      </div>
    </div>,
    document.body,
  );
}
