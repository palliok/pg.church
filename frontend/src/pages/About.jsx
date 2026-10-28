import { useEffect, useRef, useState } from 'react';
import ContactsCard from '../components/ContactsCard.jsx';
import ChurchHistory from '../components/ChurchHistory.jsx';
import GospelGuide from '../components/GospelGuide.jsx';
import { t } from '../i18n.js';
import './About.css';

// Призвание члена церкви на Поклонной горе — текст церкви, порядок и ключевые слова как в оригинале.
const CALLING = [
  { word: 'Библия', text: 'Духовно растём во Христе через наставление в Слове Божьем — лично и общинно, на богослужениях и в домашних группах.' },
  { word: 'Молитва', text: 'Молимся Господу лично и общинно — за всех людей и друг за друга.' },
  { word: 'Благовестие', text: 'Возвещаем Евангелие Иисуса Христа там, где Господь поместил нас.' },
  { word: 'Служение', text: 'Служим в любви Христа друг другу и всем людям.' },
  { word: 'Жертвенность', text: 'Жертвуем на служение и развитие церкви — регулярно и щедро.' },
  { word: 'Послушание', text: 'Находимся в послушании авторитету поместной церкви и её служителям.' },
  { word: 'Личная святость', text: 'Живём жизнью, достойной звания ученика Иисуса Христа.' },
];

const pad = (n) => String(n).padStart(2, '0');

// Разделы страницы — три карточки во вступлении, в цветах самих разделов (id — у секций).
// big — крупная цифра карточки, note — подпись к ней.
const TOC = [
  { id: 'history', label: 'История', big: '1864', note: 'больше полутора веков истории', tone: 'history' },
  { id: 'calling', label: 'Призвание', big: '7', note: 'пунктов призвания члена церкви', tone: 'calling' },
  { id: 'gospel', label: 'Благая весть', big: 'V', note: 'глав о том, во что мы верим', tone: 'gospel' },
];

const scrollTo = (id) => (e) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// «Мостик» между разделами: тонкая линия, ромб, фраза-связка и стрелка к следующему разделу.
function Bridge({ to, children }) {
  return (
    <a className="about-bridge" href={`#${to}`} onClick={scrollTo(to)}>
      <i className="about-bridge-line" aria-hidden="true" />
      <i className="about-bridge-mark" aria-hidden="true" />
      <span className="about-bridge-text">{children}</span>
      <span className="about-bridge-go" aria-hidden="true">↓</span>
    </a>
  );
}

export default function About() {
  // Пункт призвания, до которого дочитали: последний, чей верх выше «линии чтения» (середина экрана).
  // Считается по прокрутке, а не по пересечениям, — так ни один пункт не пропускается при быстрой
  // прокрутке. --calling-p (0…1) — сколько списка прочитано: заполняет линию прогресса.
  const [active, setActive] = useState(0);
  const items = useRef([]);
  const list = useRef(null);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = 0;
      const line = window.innerHeight * 0.5;
      let cur = 0;
      items.current.forEach((el, i) => { if (el && el.getBoundingClientRect().top <= line) cur = i; });
      setActive(cur);
      const r = list.current?.getBoundingClientRect();
      if (r) list.current.parentElement.style.setProperty('--calling-p', Math.min(1, Math.max(0, (line - r.top) / r.height)).toFixed(3));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(tick); };
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    tick();
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Переход к пункту: его верх встаёт чуть выше линии чтения, и он сразу становится текущим.
  const go = (i) => {
    const el = items.current[i];
    if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.42, behavior: 'smooth' });
  };

  return (
    <div className="page-enter container page-bg about" style={{ '--title-chars': t('О церкви').length }}>
      {/* Крупный фоновый заголовок, как на других страницах (page-bg в global.css). */}
      <h1 className="page-title page-title--bg">О церкви</h1>

      {/* Вступление: главная фраза и три карточки-главы в цветах своих разделов. */}
      <section className="about-intro about-body">
        {/* Оформление как у документа: лист с двойной тонкой рамкой и строкой-шапкой. */}
        <div className="about-intro-screen">
        <div className="about-intro-status" aria-hidden="true">
          <span>О церкви · Поклонная гора</span>
          <span>С 1864 года</span>
        </div>
        <div className="about-intro-body">
        <p className="about-lead">
          Церковь на Поклонной горе в&nbsp;Озерках сегодня&nbsp;— самая большая община{' '}
          <span className="nowrap">евангельских</span> <span className="nowrap">христиан-баптистов</span> в&nbsp;России.
        </p>
        <nav className="about-cards" aria-label="Разделы страницы">
          {TOC.map((t, i) => (
            <a key={t.id} href={`#${t.id}`} onClick={scrollTo(t.id)} className={`about-card is-${t.tone}`}>
              <span className="about-card-top">
                <span className="about-card-num">{pad(i + 1)}</span>
                <span className="about-card-go" aria-hidden="true">↓</span>
              </span>
              <span className="about-card-big" aria-hidden="true">{t.big}</span>
              <span className="about-card-bottom">
                <span className="about-card-label">{t.label}</span>
                <span className="about-card-note">{t.note}</span>
              </span>
            </a>
          ))}
        </nav>
        </div>
        </div>
      </section>

      <Bridge to="history">С&nbsp;чего всё начиналось</Bridge>

      <ChurchHistory />

      <Bridge to="calling">История продолжается сегодня — в&nbsp;призвании каждого члена церкви</Bridge>

      {/* Призвание: девиз слева (на десктопе закреплён), семь пунктов справа. */}
      <section className="about-calling" id="calling" aria-labelledby="about-calling-title">
        <div className="about-calling-head">
          <span className="about-kicker" id="about-calling-title">Призвание члена церкви на Поклонной горе</span>
          <blockquote className="about-motto">
            «Прославлять Бога, живя по&nbsp;Его слову»
          </blockquote>
          <p className="about-calling-intro">Следуя этому призванию, мы:</p>

          {/* Где читатель: крупный номер текущего пункта и шкала из семи делений. */}
          <div className="about-calling-meter">
            <span className="about-calling-current" aria-hidden="true">
              <span key={active}>{pad(active + 1)}</span>
              <small>/ {pad(CALLING.length)}</small>
            </span>
            <nav className="about-calling-rail" aria-label="Пункты призвания">
              {CALLING.map((c, i) => (
                <button key={c.word} type="button" className={i === active ? 'is-on' : ''} aria-current={i === active ? 'step' : undefined} onClick={() => go(i)}>
                  <i />
                  <span>{c.word}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="about-calling-body">
          {/* Телефон: закреплённая плашка над списком — номер и слово текущего пункта, прогресс. */}
          <div className="about-calling-sticky" aria-hidden="true">
            <span className="about-calling-sticky-num"><b key={active}>{pad(active + 1)}</b> / {pad(CALLING.length)}</span>
            <span className="about-calling-sticky-word" key={`w${active}`}>{CALLING[active].word}</span>
            <i />
          </div>

          <ol className="about-calling-list" ref={list}>
            {CALLING.map((c, i) => (
              <li key={c.word} ref={(el) => { items.current[i] = el; }} className={`about-calling-item${i === active ? ' is-on' : ''}${i < active ? ' is-read' : ''}`}>
                <span className="about-calling-num" aria-hidden="true">{pad(i + 1)}</span>
                <span className="about-calling-word">{c.word}</span>
                <p className="about-calling-text">{c.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Bridge to="gospel">А&nbsp;в&nbsp;основании всего — неизменная Благая весть</Bridge>

      <GospelGuide />

      <Bridge to="visit">Мы открыты для всех, кто ищет, — приходите</Bridge>

      {/* Во что мы верим и как нас найти. */}
      <section className="about-bottom" id="visit">
        <div className="about-faith">
          <span className="about-kicker">Во что мы верим</span>
          <p className="about-faith-words">Библия, Христос, община</p>
          <p className="about-faith-text">
            Мы живём по Писанию, верим в спасение по благодати и растём вместе в малых группах.
          </p>
        </div>
        <ContactsCard />
      </section>
    </div>
  );
}
