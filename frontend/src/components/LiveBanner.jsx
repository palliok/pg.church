import { useLive } from '../api/live.js';
import { t } from '../i18n.js';

// Плашка «В эфире» видна, пока в настройках сайта есть ссылки на трансляцию
// (их ставит Telegram-бот или администратор). Одна ссылка — кнопка «Смотреть»,
// несколько — по кнопке на площадку: YouTube, VK Видео, Rutube…
export default function LiveBanner() {
  const live = useLive();

  if (!live?.isLive || live.links.length === 0) return null;

  const single = live.links.length === 1;

  return (
    <div
      style={{
        flex: '0 0 auto',
        background: 'var(--c-ink)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 14,
        rowGap: 8,
        padding: '11px 16px',
        fontSize: 13,
      }}
    >
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 9,
          fontFamily: 'var(--f-head)',
          fontWeight: 700,
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '.16em',
        }}
      >
        <span className="live-dot" />
        В эфире
      </span>
      <span className="desktop-only" style={{ font: '500 13px var(--f-body)', color: 'rgba(255,255,255,.6)' }}>
        {t(live.text || 'Идёт воскресное богослужение — присоединяйся онлайн')}
      </span>
      {/* На телефоне рядом с несколькими кнопками для подписи нет места. */}
      {single && (
        <span className="mobile-only" style={{ flex: 1, minWidth: 0, font: '500 11.5px var(--f-body)', color: 'rgba(255,255,255,.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          Идёт богослужение
        </span>
      )}
      <span style={{ display: 'inline-flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8 }}>
        {live.links.map((link) => (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            title={t(link.name)}
            className="pill-btn"
            style={{ background: 'var(--c-main)', color: 'var(--c-ink)', fontSize: 10, padding: single ? '8px 15px' : '8px 13px' }}
          >
            {/* Значок «▶» — только у единственной кнопки: несколько кнопок без него помещаются в строку на телефоне. */}
            {single && (
              <>
                <span className="live-play-d">▶ </span>
                <span className="play-dot" aria-hidden="true">
                  <svg width="7" height="8" viewBox="0 0 10 11"><path d="M2 1.2v8.6a.7.7 0 0 0 1.05.6l6.6-4.3a.7.7 0 0 0 0-1.2L3.05.6A.7.7 0 0 0 2 1.2Z" fill="currentColor" /></svg>
                </span>
              </>
            )}
            {single ? 'Смотреть' : t(link.name)}
          </a>
        ))}
      </span>
    </div>
  );
}
