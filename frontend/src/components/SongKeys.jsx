import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { t } from '../i18n.js';
import './SongKeys.css';

// Отступ меню от края экрана и от нижнего меню; меньше этой высоты внизу — список раскрывается вверх.
const EDGE = 12;
const MIN_BELOW = 220;

// Влезает ли меню под плашку: высота ограничена местом до нижнего меню (на телефоне) или до края окна.
// Если внизу тесно, а сверху места больше — меню раскрывается вверх.
function fitMenu(el) {
  const pill = el.parentElement.getBoundingClientRect();
  // Нижнее меню видно только на телефоне; над ним выступает волна (.tabbar-bump) — считаем от её верха.
  const tabbar = [...document.querySelectorAll('.tabbar, .tabbar-bump')].filter((item) => item.getClientRects().length);
  const bottom = Math.min(window.innerHeight, ...tabbar.map((item) => item.getBoundingClientRect().top));
  const below = bottom - pill.bottom - 6 - EDGE;
  const above = pill.top - 6 - EDGE;
  const up = below < Math.min(el.scrollHeight, MIN_BELOW) && above > below;

  el.classList.toggle('is-up', up);
  el.style.maxHeight = `${Math.max(up ? above : below, 120)}px`;
}

function Chevron() {
  return (
    <svg className="song-keys-chevron" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
      <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Тональность и каподастр в заголовке карточки: две плашки, у каждой — выпадающее меню.
// keys — 12 тональностей { step, label, isOrigin } по порядку от C, capos — лады { capo, note }:
// note — в какой тональности играть аккорды с этим каподастром.
// Тональность в круге белая, пока её не меняли, и голубая после.
export default function SongKeys({ keys, steps, onSteps, capos, capo, onCapo, tempo, time }) {
  // Открытое меню: 'key', 'capo' или null.
  const [menu, setMenu] = useState(null);
  const root = useRef(null);
  const list = useRef(null);
  const current = keys.find((item) => item.step === steps);
  const currentCapo = capos.find((item) => item.capo === capo);

  // Меню закрывается тапом мимо него и по Esc.
  useEffect(() => {
    if (!menu) return undefined;

    const onPointer = (e) => !root.current?.contains(e.target) && setMenu(null);
    const onKey = (e) => e.key === 'Escape' && setMenu(null);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  // Меню подгоняется под экран при открытии, прокрутке и повороте; список прокручивается к выбранному значению.
  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return undefined;

    fitMenu(el);
    const active = el.querySelector('[aria-pressed="true"]');
    if (active) el.scrollTop = active.offsetTop - (el.clientHeight - active.offsetHeight) / 2;

    const refit = () => fitMenu(el);
    window.addEventListener('resize', refit);
    window.addEventListener('scroll', refit, { passive: true });

    return () => {
      window.removeEventListener('resize', refit);
      window.removeEventListener('scroll', refit);
    };
  }, [menu]);

  const toggle = (name) => setMenu(menu === name ? null : name);
  // Выбор значения закрывает меню.
  const pick = (apply, value) => {
    apply(value);
    setMenu(null);
  };

  return (
    <div className="song-keys" ref={root}>
      <div className="song-keys-item">
        <button
          type="button"
          className="song-keys-pill"
          aria-expanded={menu === 'key'}
          aria-label={`${t('Тональность')} ${current?.label ?? ''}`}
          onClick={() => toggle('key')}
        >
          <span className={`song-keys-key${steps !== 0 ? ' is-changed' : ''}`}>{current?.label}</span>
          <Chevron />
        </button>
        {menu === 'key' && (
          <div className="song-keys-menu song-keys-menu-keys" ref={list} role="group" aria-label={t('Тональность')}>
            {keys.map((item) => (
              <button
                key={item.step}
                type="button"
                className={item.isOrigin ? 'is-origin' : undefined}
                aria-pressed={item.step === steps}
                title={item.isOrigin ? t('Исходная') : undefined}
                onClick={() => pick(onSteps, item.step)}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="song-keys-item">
        <button type="button" className="song-keys-pill song-keys-capo" aria-expanded={menu === 'capo'} onClick={() => toggle('capo')}>
          {capo > 0 ? (
            <>
              <span className="song-keys-label">Капо</span>
              <span className="song-keys-fret">{capo}</span>
              <span className="song-keys-note">{currentCapo?.note}</span>
            </>
          ) : <span className="song-keys-label">Без капо</span>}
          <Chevron />
        </button>
        {menu === 'capo' && (
          <div className="song-keys-menu song-keys-menu-capos" ref={list} role="group" aria-label={t('Каподастр')}>
            {capos.map((item) => (
              <button key={item.capo} type="button" aria-pressed={item.capo === capo} onClick={() => pick(onCapo, item.capo)}>
                <span className="song-keys-fret">{item.capo || <span>Без</span>}</span>
                <span className="song-keys-note">{item.note}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {tempo && <span className="song-keys-chip">{tempo} bpm</span>}
      {time && <span className="song-keys-chip">{time}</span>}
    </div>
  );
}
