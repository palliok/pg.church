export default function LiveBanner() {
  return (
    <div
      style={{
        flex: '0 0 auto',
        background: 'var(--c-ink)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
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
        Идёт воскресное богослужение — присоединяйся онлайн
      </span>
      <span className="mobile-only" style={{ flex: 1, minWidth: 0, font: '500 11.5px var(--f-body)', color: 'rgba(255,255,255,.6)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        Идёт богослужение
      </span>
      <a
        href="#watch"
        className="pill-btn"
        style={{ background: 'var(--c-main)', color: 'var(--c-ink)', fontSize: 10, padding: '8px 15px' }}
      >
        <span className="live-play-d">▶ </span>
        <span className="play-dot" aria-hidden="true">
          <svg width="7" height="8" viewBox="0 0 10 11"><path d="M2 1.2v8.6a.7.7 0 0 0 1.05.6l6.6-4.3a.7.7 0 0 0 0-1.2L3.05.6A.7.7 0 0 0 2 1.2Z" fill="currentColor" /></svg>
        </span>
        Смотреть
      </a>
    </div>
  );
}
