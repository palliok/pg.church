import { t } from '../i18n.js';
import { NavLink, useNavigate } from 'react-router-dom';
import ChurchBrand from './ChurchBrand.jsx';
import LangSwitch from './LangSwitch.jsx';

const NAV_ITEMS = [
  { to: '/', label: t('Главная'), end: true },
  { to: '/schedule', label: t('Расписание') },
  { to: '/songs', label: t('Песни') },
  { to: '/announcements', label: t('Объявления') },
  { to: '/about', label: t('О церкви') },
];

export default function Header() {
  const navigate = useNavigate();

  return (
    <div className="desktop-only site-header">
      <button
        onClick={() => navigate('/')}
        style={{
          border: 'none',
          background: 'none',
          padding: 0,
          cursor: 'pointer',
          color: 'var(--c-ink)',
        }}
      >
        <ChurchBrand />
      </button>

      <nav className="site-header-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              display: 'inline-flex',
              alignItems: 'center',
              padding: '10px 16px',
              borderRadius: 999,
              fontFamily: 'var(--f-sans)',
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '.02em',
              textTransform: 'uppercase',
              background: isActive ? 'var(--c-main)' : 'transparent',
              color: 'var(--c-ink)',
              boxShadow: 'none',
              transition: 'background .18s ease',
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <LangSwitch />
        <NavLink to="/donate" className="pill-btn" style={{ background: 'var(--c-main)', color: 'var(--c-ink)', fontSize: 11.5, padding: '11px 20px' }}>
          Поддержать
        </NavLink>
      </div>
    </div>
  );
}
