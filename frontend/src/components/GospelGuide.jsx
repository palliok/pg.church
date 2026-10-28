import { useRef, useState } from 'react';
import { gospelGuide } from '../data/gospelGuide.js';
import useAutoplay from '../hooks/useAutoplay.js';
import useRibbon from '../hooks/useRibbon.js';

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

// Справочник «Благая весть» — электронная книга: слева оглавление (на телефоне — лентой),
// справа ридер в тёмной рамке. На экране — строка состояния, текст главы, внизу индикатор
// глав и кнопки листания. При смене главы экран коротко «мигает», как электронная бумага.
export default function GospelGuide() {
  const [cur, setCur] = useState(0);
  const tabs = useRef([]);
  const { ref: ribbonRef } = useRibbon();
  const reader = useRef(null);
  const screen = useRef(null);
  const topic = gospelGuide[cur];
  const last = gospelGuide.length - 1;

  const pick = (i, { focus = false, scroll = false } = {}) => {
    const n = Math.max(0, Math.min(last, i));
    setCur(n);
    const tab = tabs.current[n];
    // На телефоне оглавление — лента: выбранная глава встаёт по центру.
    if (tab) tab.parentElement.scrollTo({ left: tab.offsetLeft - (tab.parentElement.clientWidth - tab.offsetWidth) / 2, behavior: 'smooth' });
    if (focus) tab?.focus({ preventScroll: true });
    if (scroll) reader.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };
  // Автопрокрутка глав каждые 5 с; после последней — снова первая. Пауза при любом действии
  // (выбор главы, листание, прокрутка текста на экране ридера).
  const { ref: auto, running } = useAutoplay(() => pick(cur === last ? 0 : cur + 1));

  // Стрелки переключают главы, как у вкладок.
  const onKey = (e) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    pick((cur + step + gospelGuide.length) % gospelGuide.length, { focus: true });
  };

  return (
    <section className="guide" ref={auto} id="gospel" aria-labelledby="guide-title">
      <div className="guide-side">
        <span className="about-kicker">Справочник</span>
        <h2 className="guide-title" id="guide-title">Благая весть</h2>
        <p className="guide-lead">Пять глав о том, во что мы верим — от сотворения мира до спасения.</p>

        {/* Лента: на телефоне листается пальцем, края затухают там, где есть ещё пункты. */}
        <div className="ribbon">
          <div className="guide-tabs" ref={ribbonRef} data-autoplay-hold role="tablist" aria-orientation="vertical" onKeyDown={onKey}>
            {gospelGuide.map((t, i) => (
              <button
                key={t.word}
                ref={(el) => { tabs.current[i] = el; }}
                type="button"
                role="tab"
                id={`guide-tab-${i}`}
                aria-selected={i === cur}
                aria-controls="guide-panel"
                tabIndex={i === cur ? 0 : -1}
                className={`guide-tab${i === cur ? ' is-on' : ''}${i < cur ? ' is-read' : ''}`}
                onClick={() => pick(i)}
              >
                <span className="guide-tab-num">{ROMAN[i]}</span>
                <span className="guide-tab-word">{t.word}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ридер: рамка устройства, экран, строка состояния, текст главы, листание. */}
      <div className="guide-reader" ref={reader}>
        <div className="guide-screen" id="guide-panel" role="tabpanel" aria-labelledby={`guide-tab-${cur}`}>
          <div className="guide-status" aria-hidden="true">
            <span>Глава {ROMAN[cur]} · Благая весть</span>
            <span>{cur + 1} / {last + 1}</span>
          </div>

          {/* key — чтобы экран «обновлялся» заново при смене главы. */}
          <div className="guide-page" key={cur} ref={screen} data-autoplay-scroll>
            <h3 className="guide-answer-title">{topic.word}</h3>
            <div className="guide-text">
              {topic.body.map((b, i) => (typeof b === 'string'
                ? <p key={i}>{b}</p>
                : (
                  <blockquote key={i} className="guide-quote">
                    <p>«{b.quote}»</p>
                    <cite>{b.ref}</cite>
                  </blockquote>
                )))}
            </div>
          </div>

          <div className="guide-controls">
            <button type="button" className="guide-flip" onClick={() => pick(cur === 0 ? last : cur - 1, { scroll: true })} aria-label="Предыдущая глава"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5 8 12l7 7" /></svg></button>
            <div className="guide-progress" aria-hidden="true">
              {gospelGuide.map((t, i) => <i key={t.word} className={i <= cur ? 'is-on' : ''} />)}
            </div>
            <button type="button" className="guide-flip is-next" onClick={() => pick(cur === last ? 0 : cur + 1, { scroll: true })} aria-label="Следующая глава">
              {/* Кольцо — отсчёт автопрокрутки (5 с) по часовой стрелке; в паузе скрыто. */}
              {running && (
                <svg className="flip-ring" key={cur} viewBox="0 0 72 72" aria-hidden="true">
                  <circle cx="36" cy="36" r="34" pathLength="100" />
                </svg>
              )}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
