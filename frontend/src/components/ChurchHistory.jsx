import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { churchHistory } from '../data/churchHistory.js';
import useAutoplay from '../hooks/useAutoplay.js';
import useRibbon from '../hooks/useRibbon.js';

// История церкви: линейка лет сверху, под ней выбранная глава — крупный год и текст.
// Стрелки «назад / вперёд» и клавиши ← → листают годы; на телефоне линейка листается пальцем.
export default function ChurchHistory() {
  const [cur, setCur] = useState(0);
  const tabs = useRef([]);
  const { ref: ribbonRef } = useRibbon();
  const item = churchHistory[cur];
  const last = churchHistory.length - 1;

  const pick = (i, focus) => {
    const n = Math.max(0, Math.min(last, i));
    setCur(n);
    const tab = tabs.current[n];
    // Выбранный пункт ленты — по центру, соседи видны с обеих сторон.
    if (tab) tab.parentElement.scrollTo({ left: tab.offsetLeft - (tab.parentElement.clientWidth - tab.offsetWidth) / 2, behavior: 'smooth' });
    if (focus) tab?.focus({ preventScroll: true });
  };
  // Автопрокрутка лет каждые 5 с; после последнего — снова первый. Пауза при любом действии.
  const { ref: auto, running } = useAutoplay(() => pick(cur === last ? 0 : cur + 1));

  const onKey = (e) => {
    const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    pick(cur + step, true);
  };

  return (
    <section className="hist" ref={auto} id="history" aria-labelledby="hist-title" style={{ '--progress': cur / last }}>
      <div className="hist-head">
        <div>
          <span className="about-kicker">История церкви</span>
          {/* Заголовок — название выбранной главы, сменяется вместе с годом. */}
          <h2 className="hist-title" id="hist-title" key={cur} aria-live="polite">{item.title}</h2>
        </div>
      </div>

      {/* Линейка лет: заполняется до выбранного года. */}
      {/* Лента: на телефоне листается пальцем, края затухают там, где есть ещё пункты. */}
      <div className="ribbon">
        <div className="hist-ruler" ref={ribbonRef} data-autoplay-hold role="tablist" aria-label="Годы" onKeyDown={onKey}>
          {churchHistory.map((h, i) => (
            <button
              key={h.year}
              ref={(el) => { tabs.current[i] = el; }}
              type="button"
              role="tab"
              id={`hist-tab-${i}`}
              aria-selected={i === cur}
              aria-controls="hist-panel"
              tabIndex={i === cur ? 0 : -1}
              className={`hist-year${i === cur ? ' is-on' : ''}${i < cur ? ' is-past' : ''}`}
              onClick={() => pick(i)}
            >
              <i />
              <span>{h.year}</span>
            </button>
          ))}
        </div>
      </div>


      {/* Слева крупная дата и под ней стрелки — они всегда на одном месте (дата в блоке
          постоянной высоты); справа текст главы. Меняются только дата и текст. */}
      <div className="hist-panel" id="hist-panel" role="tabpanel" aria-labelledby={`hist-tab-${cur}`}>
        <div className="hist-side">
          <div className="hist-big-box">
            <span className={`hist-big${item.today ? ' is-word' : ''}`} key={cur} aria-hidden="true">{item.year}</span>
          </div>

          {/* Круглые кнопки с годом под ними (на телефоне — справа от даты). Кольцо вокруг «вперёд» — отсчёт
              автопрокрутки (5 с), в паузе скрыто. */}
        <div className="hist-deck">
          <button type="button" className="hist-deck-btn is-prev" onClick={() => pick(cur === 0 ? last : cur - 1)} aria-label="Раньше">
            <span className="hist-deck-knob"><span aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5 8 12l7 7" /></svg></span></span>
            <small>{churchHistory[cur === 0 ? last : cur - 1].year}</small>
          </button>
          <button type="button" className="hist-deck-btn is-next" onClick={() => pick(cur === last ? 0 : cur + 1)} aria-label="Позже">
            <span className="hist-deck-knob">
              {running && (
                <svg className="hist-deck-ring" key={cur} viewBox="0 0 72 72" aria-hidden="true">
                  <circle cx="36" cy="36" r="34" pathLength="100" />
                </svg>
              )}
              <span aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 5 7 7-7 7" /></svg></span>
            </span>
            <small>{churchHistory[cur === last ? 0 : cur + 1].year}</small>
          </button>
        </div>
        </div>

        <div className="hist-text" key={cur}>
          {item.body.map((p, j) => <p key={j}>{p}</p>)}
          {item.today && (
            <Link to="/schedule" className="hist-cta">
              Расписание встреч <span aria-hidden="true">⟶</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
