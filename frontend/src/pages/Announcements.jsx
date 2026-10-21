import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAnnouncements } from '../api/announcements.js';
import { AnnouncementCard, ImportantPill } from '../components/AnnouncementCards.jsx';
import LoadStatus from '../components/LoadStatus.jsx';
import LongArrow from '../components/LongArrow.jsx';
import { t } from '../i18n.js';

// Вкладки колоды — тёплый серый, светлеет с удалением от открытой карточки.
const SHADES = ['#e2e3da', '#eaebe4', '#f1f1ec', '#f5f5f1', '#f8f8f5'];

// Вкладка колоды выше или ниже открытой карточки: чем дальше, тем светлее и уже.
// Ближние к карточке лежат поверх дальних.
function tabStyle(index, activeIndex, count) {
  const distance = Math.abs(index - activeIndex);
  const above = index < activeIndex;
  const inset = Math.min(distance - 1, 4) * 8;

  return {
    zIndex: above ? index + 1 : count - index,
    marginLeft: inset,
    marginRight: inset,
    marginTop: above ? (index ? -14 : 0) : -16,
    background: SHADES[Math.min(distance, SHADES.length) - 1],
  };
}

// Число и месяц события в один день; у объявления без даты, со сроком «до» или на несколько дней колонки нет.
function DateBlock({ item, className }) {
  if (!item.eventDate || item.eventEnd) return null;

  return (
    <span className={className}>
      <span className="ann-day">{item.eventDate.day}</span>
      <span className="ann-month">{item.eventDate.mon}</span>
    </span>
  );
}

// Объявления одной страницей, по дате. Открытое — чёрная карточка, остальные —
// вкладки (на телефоне колодой вокруг карточки, на десктопе списком слева).
// ?a=<id> открывает нужное объявление: этой ссылкой делятся.
export default function Announcements() {
  const { items, loading, error, retry } = useAnnouncements();
  const [params, setParams] = useSearchParams();
  const [fromLink, setFromLink] = useState(() => params.has('a'));
  const [toast, setToast] = useState('');
  const deckCardRef = useRef(null);
  const toastTimer = useRef(null);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const linked = items.find((item) => String(item.id) === params.get('a'));
  const active = linked ?? items[0];
  const activeIndex = items.indexOf(active);

  const select = (item) => {
    setFromLink(false);
    setParams({ a: String(item.id) }, { replace: true });

    // На телефоне карточка могла уехать выше экрана — возвращаем её в поле зрения.
    requestAnimationFrame(() => {
      const top = deckCardRef.current?.getBoundingClientRect().top;
      if (top < 0) window.scrollTo({ top: window.scrollY + top - 80, behavior: 'smooth' });
    });
  };

  const showToast = (text) => {
    clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = setTimeout(() => setToast(''), 2000);
  };

  // Системное меню «Поделиться», а где его нет — ссылка в буфер обмена.
  const share = async (item) => {
    const url = new URL(window.location.href);
    url.search = `?a=${item.id}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, url: url.toString() });
        return;
      }
      await navigator.clipboard.writeText(url.toString());
      showToast(t('Ссылка скопирована'));
    } catch (shareError) {
      // Пользователь закрыл меню «Поделиться» — это не ошибка.
      if (shareError?.name !== 'AbortError') showToast(t('Не удалось скопировать ссылку'));
    }
  };

  return (
    <div className="page-enter container ann-page">
      <h1 className="page-title">Объявления</h1>

      {(loading || error) && <LoadStatus error={error} onRetry={retry} />}

      {!loading && !error && items.length === 0 && (
        <div className="ann-empty">
          <div className="h-display" style={{ fontSize: 22 }}>Объявлений пока нет</div>
        </div>
      )}

      {active && (
        <>
          {/* Телефон: колода */}
          <div className="ann-deck">
            {items.map((item, index) => (index === activeIndex ? (
              <div key={item.id} ref={deckCardRef} className="ann-deck-card" style={{ zIndex: items.length + 1, marginTop: index ? -16 : 0 }}>
                <AnnouncementCard item={item} fromLink={fromLink && item === linked} onShare={share} />
              </div>
            ) : (
              <button
                key={item.id}
                type="button"
                className={`ann-tab ${index < activeIndex ? 'is-above' : 'is-below'}`}
                style={tabStyle(index, activeIndex, items.length)}
                onClick={() => select(item)}
              >
                <DateBlock item={item} className="ann-tab-date" />
                <span className="ann-tab-title">{item.title}</span>
              </button>
            )))}
          </div>

          {/* Десктоп: список слева, открытая карточка справа */}
          <div className="ann-split">
            <div className="ann-list">
              {items.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`ann-row ${item === active ? 'is-active' : ''}`}
                  aria-current={item === active ? 'true' : undefined}
                  onClick={() => select(item)}
                >
                  <DateBlock item={item} className="ann-row-date" />
                  <span className="ann-row-title">
                    <span>{item.title}</span>
                    {item.important && <ImportantPill />}
                  </span>
                  <span className="ann-row-arrow"><LongArrow width={28} stroke={2.6} /></span>
                </button>
              ))}
            </div>
            <div className="ann-split-card">
              <AnnouncementCard item={active} fromLink={fromLink && active === linked} onShare={share} className="is-large" />
            </div>
          </div>
        </>
      )}

      {toast && <div className="ann-toast" role="status">{toast}</div>}
    </div>
  );
}
