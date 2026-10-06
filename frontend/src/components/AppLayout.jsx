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

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <TabBar />

      <footer
        className="site-footer container"
      >
        <div className="site-footer-desktop desktop-only">
            <p lang="ru" className="site-footer-legal">
              <span>Местная религиозная организация «Санкт-Петербургская церковь евангельских христиан-баптистов» зарегистрирована Министерством юстиции за № 220-Р от 22.12.1999 г.</span>
              <span>ИНН 7802038805 · КПП 780201001 · ОГРН 1027800013768 · Юридический адрес: 194214, г. Санкт-Петербург, ул. Большая Озёрная, д. 27.</span>
            </p>
        </div>
        <div
          className="mobile-only container"
          style={{
            paddingTop: 12,
          }}
        >
          <div>
            <p lang="ru" style={{ margin: 0, fontSize: 12, lineHeight: 1.5 }}>
              Местная религиозная организация «Санкт-Петербургская церковь евангельских христиан-баптистов» зарегистрирована Министерством юстиции за № 220-Р от 22.12.1999 г.
            </p>
          </div>

          <div lang="ru" style={{ marginTop: 4, color: 'var(--c-gray-text)', fontSize: 12, lineHeight: 1.5 }}>
            <p style={{ margin: 0 }}>ИНН 7802038805 · КПП 780201001 · ОГРН 1027800013768</p>
            <p style={{ margin: '2px 0 0' }}>
              Юридический адрес: 194214, г. Санкт-Петербург, ул. Большая Озёрная, д. 27
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
