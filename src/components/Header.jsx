import { t, getLang, langPath } from '../i18n.js';
import { NavLink, useNavigate } from 'react-router-dom';

const CURRENT_LANG = getLang();

const NAV_ITEMS = [
  { to: '/', label: t('Главная'), end: true },
  { to: '/schedule', label: t('Расписание') },
  { to: '/songs', label: t('Песни') },
  { to: '/media', label: t('Новости') },
  { to: '/about', label: t('О церкви') },
];

export default function Header() {
  const navigate = useNavigate();

  return (
    <div
      className="desktop-only"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 24,
        padding: '18px 32px 14px',
        maxWidth: 'var(--content-max)',
        margin: '0 auto',
        width: '100%',
      }}
    >
      <button
        onClick={() => navigate('/')}
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 10,
          border: 'none',
          background: 'none',
          padding: 0,
          cursor: 'pointer',
          color: 'var(--c-ink)',
        }}
      >
        <span style={{ fontFamily: 'var(--f-head)', fontWeight: 800, fontSize: 24, letterSpacing: '-.025em' }}>
          Поклонная
        </span>
        <span style={{ font: '500 17px var(--f-body)', color: 'var(--c-gray-text)' }}>гора</span>
      </button>

      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          padding: 5,
          borderRadius: 999,
          background: 'var(--c-panel)',
        }}
      >
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
              fontFamily: 'var(--f-head)',
              fontWeight: 700,
              fontSize: 12,
              letterSpacing: '.02em',
              textTransform: 'uppercase',
              background: isActive ? 'var(--c-yellow)' : 'transparent',
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: 'var(--c-panel)',
            borderRadius: 999,
            padding: 3,
          }}
        >
          {['RU', 'EN', 'KY'].map((lng) => {
            const code = lng.toLowerCase();
            const active = CURRENT_LANG === code;
            return (
              <button
                key={lng}
                type="button"
                onClick={() => { window.location.href = langPath(code); }}
                style={{ border: 'none', fontFamily: 'var(--f-head)', fontWeight: 700, fontSize: 11, color: active ? '#fff' : 'var(--c-gray-text)', background: active ? 'var(--c-ink)' : 'transparent', padding: '8px 12px', borderRadius: 999, cursor: 'pointer' }}
              >{lng}</button>
            );
          })}
        </div>
        <NavLink to="/donate" className="pill-btn" style={{ background: 'var(--c-yellow)', color: 'var(--c-ink)', fontSize: 11.5, padding: '11px 20px' }}>
          Поддержать
        </NavLink>
      </div>
    </div>
  );
}
