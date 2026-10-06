import { t } from '../i18n.js';
import { NavLink } from 'react-router-dom';

const TABS = [
  {
    to: '/', end: true, label: t('Главная'),
    icon: <path d="M4 10.5 12 4l8 6.5M6.5 10.4V20h11v-9.6" />,
  },
  {
    to: '/schedule', label: t('События'),
    icon: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2.5" />
        <path d="M3 9.5h18M8 3v4M16 3v4" />
      </>
    ),
  },
  {
    to: '/songs', label: t('Песни'),
    icon: (
      <>
        <path d="M9 18V6.5l10-2V16" />
        <circle cx="6.5" cy="18" r="2.5" />
        <circle cx="16.5" cy="16" r="2.5" />
      </>
    ),
  },
  {
    to: '/about', label: t('О нас'),
    icon: (
      <>
        <path d="M12 2v3M10.4 3.4h3.2M4.5 11 12 5l7.5 6M6.8 11v9h10.4v-9M10 20v-3.6a2 2 0 0 1 4 0V20" />
      </>
    ),
  },
  {
    to: '/donate', label: t('Помочь'),
    icon: (
      <>
        <path d="M4 21v-7.5a2 2 0 0 1 2-2h2.5l3 2h4a2 2 0 0 1 0 4H11" />
        <path d="M4 13.5H1.5V21H4z" />
        <circle cx="16" cy="5.5" r="3.5" />
      </>
    ),
  },
];

export default function TabBar() {
  return (
    <div
      className="mobile-only"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 20,
        zIndex: 30,
        justifyContent: 'center',
        padding: '0 12px',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          width: 'fit-content',
          margin: '0 auto',
          padding: '5px 14px',
          borderRadius: 999,
          background: 'var(--c-ink)',
          boxShadow: '0 18px 38px -14px rgba(0,0,0,.7)',
          pointerEvents: 'auto',
          maxWidth: '100%',
          overflowX: 'auto',
        }}
      >
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            aria-label={tab.label}
            style={({ isActive }) => ({
              height: 46,
              width: isActive ? 'auto' : 42,
              padding: isActive ? '0 14px 0 11px' : 0,
              border: 'none',
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              flex: '0 0 auto',
              transition: 'background .25s, color .25s',
              background: isActive ? 'var(--c-yellow)' : 'transparent',
              color: isActive ? 'var(--c-ink)' : 'rgba(255,255,255,.55)',
            })}
          >
            {({ isActive }) => (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {tab.icon}
                </svg>
                <span
                  style={{
                    display: isActive ? 'inline' : 'none',
                    fontFamily: 'var(--f-head)',
                    fontWeight: 700,
                    fontSize: 11,
                    letterSpacing: '.03em',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
