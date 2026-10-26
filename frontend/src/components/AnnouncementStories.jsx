import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { t } from '../i18n.js';
import { DatePart, ImportantPill, Megaphone } from './AnnouncementCards.jsx';
import { CloseIcon, PauseIcon, PhoneIcon, PlaceIcon, PlayCircleIcon, PlayIcon, ShareIcon } from './Icons.jsx';
import LongArrow from './LongArrow.jsx';
import './AnnouncementStories.css';

// Сколько показывается одна сторис; столько же длится заливка полоски в CSS (--ann-story-ms).
const STORY_MS = 7000;
// Дольше — уже не нажатие, а удержание: сторис стоит на паузе, пока палец на экране.
const HOLD_MS = 250;

// Дата на плитке: срок «до» или первый день события. У объявления без даты колонки нет.
function tileDate(item) {
  if (item.deadline) return { ...item.deadline, label: t('До') };
  if (item.eventDate) return { ...item.eventDate, label: item.eventDate.dow };

  return null;
}

// Плитка объявления на телефоне (макет design_handoff_stories_26c): дата, «Важно» и пилюли с длительностью
// и временем или уточнением, заголовок и значок play.
// Непрочитанная — тёмная, прочитанная — светлая. Нажатие открывает сторис.
export function AnnouncementTile({ item, read = false, onOpen }) {
  const date = tileDate(item);
  const when = item.details.find((detail) => detail.type === 'when');
  const hasPills = Boolean(item.important || item.days || when);

  return (
    <button type="button" className={`ann-tile ${read ? 'is-read' : ''} ${date ? '' : 'is-undated'}`} onClick={onOpen}>
      {date && (
        <span className="ann-tile-date">
          <span className="ann-tile-label">{date.label}</span>
          <span className="ann-tile-day">
            <span className="ann-tile-num">{date.day}</span>
            <span className="ann-tile-mon">{date.mon}</span>
          </span>
        </span>
      )}
      <span className="ann-tile-text">
        {hasPills && (
          <span className="ann-tile-pills">
            {item.important && <ImportantPill />}
            {item.days && <span className="ann-tile-pill">{item.days}</span>}
            {when && <span className="ann-tile-pill">{when.text}</span>}
          </span>
        )}
        <span className="ann-tile-title">{item.title}</span>
      </span>
      <PlayCircleIcon />
    </button>
  );
}

// Полноэкранные сторис с объявлениями: каждая идёт 7 секунд, потом следующая, после последней — закрываются.
// Нажатие в левой трети — назад, правее — вперёд, свайп вбок листает, вниз — закрывает, удержание — пауза.
// index — текущая, onIndex(i) — перейти, onSeen(id) — показана (отметить прочитанной).
export default function AnnouncementStories({ items, index, onIndex, onClose, onSeen, onShare }) {
  const [paused, setPaused] = useState(false);
  const [holding, setHolding] = useState(false);
  // Счётчик показов: новый ключ перезапускает заливку полоски, даже если сторис та же (назад с первой).
  const [run, setRun] = useState(0);
  const gesture = useRef(null);
  const holdTimer = useRef(null);
  const swipeStart = useRef(null);
  const closeRef = useRef(null);
  const item = items[index];

  const go = (step) => {
    const next = index + step;
    if (next >= items.length) {
      onClose();
      return;
    }
    onIndex(Math.max(0, next));
    setRun((value) => value + 1);
  };

  useEffect(() => {
    onSeen(String(item.id));
  }, [item.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Страница под сторис не прокручивается, фокус — на «Закрыть».
  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = overflow;
      clearTimeout(holdTimer.current);
    };
  }, []);

  // Esc закрывает, стрелки листают. Подписка на каждый рендер, чтобы go видел текущую сторис.
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') go(-1);
      if (event.key === 'ArrowRight') go(1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  // Кнопки и ссылки работают как обычно, нажатия и свайпы ловим только на остальной площади.
  const onPointerDown = (event) => {
    if (event.target.closest('a, button')) return;
    gesture.current = { x: event.clientX, y: event.clientY, at: Date.now() };
    holdTimer.current = setTimeout(() => setHolding(true), HOLD_MS);
  };

  const endGesture = () => {
    const start = gesture.current;
    gesture.current = null;
    clearTimeout(holdTimer.current);
    setHolding(false);
    return start;
  };

  const onPointerUp = (event) => {
    const start = endGesture();
    if (!start) return;
    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;

    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      go(dx < 0 ? 1 : -1);
    } else if (Date.now() - start.at < HOLD_MS && Math.abs(dx) < 10 && Math.abs(dy) < 10) {
      const box = event.currentTarget.getBoundingClientRect();
      go(event.clientX - box.left < box.width / 3 ? -1 : 1);
    }
  };

  // Свайп вниз: вертикальное движение браузер забирает себе (pointercancel), поэтому его ловим через touch-события.
  // Если текст прокручен, свайп вниз сначала возвращает его к началу.
  const onTouchStart = (event) => {
    const content = event.currentTarget.querySelector('.ann-story-content');
    swipeStart.current = content?.scrollTop > 0 ? null : event.touches[0].clientY;
  };
  const onTouchEnd = (event) => {
    if (swipeStart.current !== null && event.changedTouches[0].clientY - swipeStart.current > 90) onClose();
    swipeStart.current = null;
  };

  const where = item.details.find((detail) => detail.type === 'where');
  const when = item.details.find((detail) => detail.type === 'when');
  const links = item.details.filter((detail) => detail.type === 'link');
  const hasDates = Boolean(item.deadline || item.eventDate);
  const hasPills = Boolean(item.days || when);

  // Портал в body: у страницы анимация появления с transform, внутри неё position: fixed не встал бы на весь экран.
  return createPortal(
    <div
      className={`ann-story ${paused || holding ? 'is-paused' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={t('Объявления')}
      style={{ '--ann-story-ms': `${STORY_MS}ms` }}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={endGesture}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <Megaphone className="ann-story-megaphone" />

      <div className="ann-story-bars" aria-hidden="true">
        {items.map((story, i) => (
          <span key={story.id} className="ann-story-bar">
            {i < index && <span className="ann-story-fill is-done" />}
            {i === index && <span key={run} className="ann-story-fill is-current" onAnimationEnd={() => go(1)} />}
          </span>
        ))}
      </div>

      <div className="ann-story-top">
        <span className="ann-story-pos">
          {index + 1} / {items.length}
          {paused && <> · <span>Пауза</span></>}
        </span>
        <span className="ann-story-actions">
          <button type="button" className="ann-story-btn" aria-label={paused ? 'Продолжить' : 'Пауза'} onClick={() => setPaused(!paused)}>
            {paused ? <PlayIcon size={28} /> : <PauseIcon size={28} />}
          </button>
          <button ref={closeRef} type="button" className="ann-story-btn" aria-label="Закрыть" onClick={onClose}>
            <CloseIcon size={26} />
          </button>
        </span>
      </div>

      {/* key — новая сторис начинается с верха, даже если предыдущую прокрутили */}
      <div key={item.id} className="ann-story-content" aria-live="polite">
        <div className="ann-story-head">
          {item.important && <ImportantPill />}
          <h2 className="ann-story-title">{item.title}</h2>
        </div>

        {/* Даты и белые пилюли (длительность, время или уточнение) — одной строкой, пилюли по низу цифр */}
        {(hasDates || hasPills) && (
          <div className={`ann-dates ann-story-dates ${item.eventEnd ? 'is-range' : ''}`}>
            {item.deadline && <DatePart label={t('До')} date={item.deadline} />}
            {item.eventDate && <DatePart label={item.eventDate.dow} date={item.eventDate} />}
            {item.eventEnd && (
              <>
                <span className="ann-dates-arrow"><LongArrow width={34} stroke={2} /></span>
                <DatePart label={item.eventEnd.dow} date={item.eventEnd} />
              </>
            )}
            {hasPills && (
              <span className={`ann-story-pills ${hasDates ? 'is-after-date' : ''}`}>
                {item.days && <span className="ann-pill">{item.days}</span>}
                {when && <span className="ann-pill">{when.text}</span>}
              </span>
            )}
          </div>
        )}
        {item.body && <p className="ann-story-body">{item.body}</p>}

        {where && (
          <span className="ann-story-place">
            <PlaceIcon size={16} />
            <span>{where.text}</span>
          </span>
        )}

        {links.length > 0 && (
          <div className="ann-story-links">
            {links.map((link) => (
              <a key={link.url + link.text} className="ann-story-link" href={link.url} target="_blank" rel="noopener noreferrer">
                {link.text}
                <LongArrow />
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="ann-story-foot">
        {item.contact && (
          <a className="ann-story-call" href={item.contact.tel}>
            <PhoneIcon size={20} />
            {/* Номер всегда целиком, длинное имя обрезается многоточием */}
            <span className="ann-story-phone">{item.contact.phone}</span>
            {item.contact.name && <span className="ann-story-call-name">· {item.contact.name}</span>}
          </a>
        )}
        <button type="button" className="ann-story-share" aria-label={t('Поделиться')} onClick={() => onShare(item)}>
          <ShareIcon size={20} />
        </button>
      </div>
    </div>,
    document.body,
  );
}
