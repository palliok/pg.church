import { useEffect, useId, useRef, useState } from 'react';
import { getLang, langPath } from '../i18n.js';
import './LangSwitcher.css';

// Названия языков — на самих языках, поэтому их не переводим.
const LANGS = [
  { code: 'ru', name: 'Русский' },
  { code: 'en', name: 'English' },
  { code: 'ky', name: 'Кыргызча' },
];

// 40 лучей солнца на флаге Кыргызстана.
const KG_RAYS = Array.from({ length: 40 }, (_, i) => {
  const a = (i * Math.PI) / 20;
  const p = (r, da) => `${(15 + r * Math.cos(a + da)).toFixed(2)},${(15 + r * Math.sin(a + da)).toFixed(2)}`;
  return `M${p(5, -0.07)} L${p(9.5, 0)} L${p(5, 0.07)}Z`;
}).join('');

// Круглый флажок: SVG обрезается по кругу, поэтому рисуем середину флага.
function Flag({ code }) {
  const id = useId();

  if (code === 'ru') {
    return (
      <svg viewBox="0 0 30 30" aria-hidden="true">
        <rect width="30" height="10" fill="#fff" />
        <rect y="10" width="30" height="10" fill="#0039a6" />
        <rect y="20" width="30" height="10" fill="#d52b1e" />
      </svg>
    );
  }

  if (code === 'en') {
    return (
      <svg viewBox="15 0 30 30" aria-hidden="true">
        <clipPath id={id}><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" /></clipPath>
        <rect width="60" height="30" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath={`url(#${id})`} stroke="#c8102e" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#c8102e" strokeWidth="6" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 30 30" aria-hidden="true">
      <rect width="30" height="30" fill="#e8112d" />
      <path d={KG_RAYS} fill="#ffef00" />
      <circle cx="15" cy="15" r="5.4" fill="#ffef00" />
      <g fill="none" stroke="#e8112d" strokeWidth=".7">
        <circle cx="15" cy="15" r="4" />
        <path d="M12.6,11.8 Q14.6,15 12.6,18.2 M17.4,11.8 Q15.4,15 17.4,18.2 M11.8,12.6 Q15,14.6 18.2,12.6 M11.8,17.4 Q15,15.4 18.2,17.4" />
      </g>
    </svg>
  );
}

// Переключатель языка в шапке: таблетка с флажком текущего языка и список остальных.
// Смена языка — переход на тот же адрес с другим префиксом и полной перезагрузкой, как и раньше.
export default function LangSwitcher() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const menuId = useId();
  const current = getLang();

  // Закрываем по клику мимо и по Esc.
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (e) => { if (!rootRef.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className={`lang-switch${open ? ' open' : ''}`} ref={rootRef}>
      <button
        type="button"
        className="lang-switch-btn"
        aria-label="Язык"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={(e) => {
          // Размер таблетки — точка, из которой раскрывается список.
          const btn = e.currentTarget;
          rootRef.current.style.setProperty('--lang-btn-w', `${btn.offsetWidth}px`);
          rootRef.current.style.setProperty('--lang-btn-h', `${btn.offsetHeight}px`);
          setOpen((v) => !v);
        }}
      >
        <span className="lang-flag"><Flag code={current} /></span>
        <svg className="lang-switch-chevron" viewBox="0 0 10 6" aria-hidden="true">
          <path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <ul className="lang-switch-menu" id={menuId} hidden={!open}>
        {LANGS.map(({ code, name }) => (
          <li key={code}>
            <a
              href={langPath(code)}
              lang={code}
              className={code === current ? 'active' : ''}
              aria-current={code === current ? 'true' : undefined}
              onClick={(e) => {
                // Текущий язык просто сворачивает список, без перезагрузки.
                if (code === current) e.preventDefault();
                setOpen(false);
              }}
            >
              <span className="lang-flag"><Flag code={code} /></span>
              <span className="lang-switch-name">{name}</span>
              {code === current && (
                <svg className="lang-switch-check" viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M3 8.5l3.2 3L13 4.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
