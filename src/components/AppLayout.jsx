import { t } from '../i18n.js';
import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';

import LiveBanner from './LiveBanner.jsx';
import Header from './Header.jsx';
import TabBar from './TabBar.jsx';

export default function AppLayout() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: 'instant' in window ? 'instant' : 'auto',
    });
  }, [location.pathname]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        background: '#fff',
      }}
    >
      <LiveBanner />

      <Header />

      <main style={{ flex: 1, paddingBottom: 24 }}>
        <Outlet />
      </main>

      <TabBar />

      <footer
        className="desktop-only container"
        style={{
          padding: '28px 32px 40px',
        }}
      >
        <div
          style={{
            borderTop: '1px solid var(--c-line)',
            paddingTop: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <span className="eyebrow">
            © {new Date().getFullYear()} {t('Церковь «Поклонная гора»')}
          </span>

          <span
            className="eyebrow"
            style={{
              color: 'var(--c-gray-text)',
            }}
          >
            Большая Озёрная, 27 · Санкт-Петербург
          </span>
        </div>
      </footer>
    </div>
  );
}