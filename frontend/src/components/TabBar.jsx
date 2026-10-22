import { cloneElement, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './TabBar.css';

// Нижняя панель на телефоне по макету design_handoff_tabbar_5a: 4 вкладки, бургер в центре и меню на весь экран.
const TABS = [
  {
    key: 'home', to: '/', label: 'Главная',
    icon: [<path key="1" d="M4 10.5 12 4l8 6.5" />, <path key="2" d="M6.5 10.4V20h11v-9.6" />],
  },
  {
    key: 'schedule', to: '/schedule', label: 'Расписание',
    icon: [
      <rect key="1" x="3" y="5" width="18" height="16" rx="2.5" />,
      <path key="2" d="M3 9.5h18" />,
      <path key="3" d="M8 3v4" />,
      <path key="4" d="M16 3v4" />,
    ],
  },
  {
    key: 'news', to: '/announcements', label: 'Объявления',
    rotate: -20,
    icon: [
      <path key="1" d="M3 10v4a1 1 0 0 0 1 1h3l9 5V4L7 9H4a1 1 0 0 0-1 1z" />,
      <path key="2" d="M7 15l1.5 5h2.5l-1.2-4.5" />,
      <path key="3" d="M19.5 9.5a3.5 3.5 0 0 1 0 5" />,
    ],
  },
  {
    key: 'about', to: '/about', label: 'О церкви',
    icon: [
      <path key="1" d="M12 2v3" />,
      <path key="2" d="M10.4 3.4h3.2" />,
      <path key="3" d="M4.5 11 12 5l7.5 6" />,
      <path key="4" d="M6.8 11v9h10.4v-9" />,
      <path key="5" d="M10 20v-3.6a2 2 0 0 1 4 0V20" />,
    ],
  },
];

const MENU_ITEMS = [
  { to: '/', label: 'Главная' },
  { to: '/story/jesus', label: 'Евангелие', gospel: true },
  { to: '/about', label: 'О церкви' },
  { to: '/schedule', label: 'Расписание' },
  { to: '/announcements', label: 'Объявления' },
  { to: '/songs', label: 'Сборник песен' },
  { to: '/donate', label: 'Пожертвования' },
];

// Пузырь над активной вкладкой: колокол ±78px от центра, высотой 16px над базовой линией.
const BASE = 20;
const PEAK = 16;
const elastic = (t) => (t === 0 || t === 1 ? t : 2 ** (-10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1);
const quart = (t) => 1 - (1 - t) ** 4;

function activeTab(pathname) {
  if (pathname === '/') return 'home';
  const tab = TABS.find((x) => x.to !== '/' && (pathname === x.to || pathname.startsWith(x.to + '/')));
  return tab ? tab.key : null;
}

function bumpPath(bump, width) {
  const bell = (c, h) => `L${c - 78},${BASE} C${c - 48},${BASE} ${c - 30},${BASE - h} ${c},${BASE - h} C${c + 30},${BASE - h} ${c + 48},${BASE} ${c + 78},${BASE}`;
  const parts = [[bump.ox, bump.oh], [bump.cx, bump.h]].filter((p) => p[1] > 0.05).sort((a, b) => a[0] - b[0]);
  return `M-400,${BASE} ${parts.map((p) => bell(p[0], p[1])).join(' ')} L${width + 400},${BASE} L${width + 400},${BASE + 2} L-400,${BASE + 2} Z`;
}

// Иконка вкладки: статичная копия и копия, которая прорисовывается по контурам при наведении.
function TabIcon({ tab }) {
  const wrap = (children) => (tab.rotate ? <g transform={`rotate(${tab.rotate} 12 12)`}>{children}</g> : children);
  return (
    <>
      <svg className="tabbar-icon tabbar-icon--static" viewBox="0 0 24 24" aria-hidden="true">{wrap(tab.icon)}</svg>
      <svg className="tabbar-icon tabbar-icon--draw" viewBox="0 0 24 24" aria-hidden="true">
        {wrap(tab.icon.map((el, i) => cloneElement(el, { pathLength: 1, style: { '--n': i + 1 } })))}
      </svg>
    </>
  );
}

export default function TabBar() {
  const { pathname } = useLocation();
  // Меню помнит адрес, на котором его открыли: после перехода на другую страницу оно само закрыто.
  const [menuAt, setMenuAt] = useState(null);
  const menuOpen = menuAt === pathname;
  const setMenuOpen = (open) => setMenuAt(open ? pathname : null);
  const [drawing, setDrawing] = useState(null);
  const active = menuOpen ? null : activeTab(pathname);

  const barRef = useRef(null);
  const svgRef = useRef(null);
  const pathRef = useRef(null);
  const tabRefs = useRef({});
  const bump = useRef({ cx: 0, h: 0, ox: 0, oh: 0 });
  const raf = useRef(0);
  const drawTimer = useRef(0);

  const draw = useCallback(() => {
    const width = barRef.current.clientWidth;
    svgRef.current.setAttribute('viewBox', `0 0 ${width} 22`);
    pathRef.current.setAttribute('d', bumpPath(bump.current, width));
  }, []);

  const centerOf = (key) => {
    const b = barRef.current.getBoundingClientRect();
    const r = tabRefs.current[key].getBoundingClientRect();
    return r.left + r.width / 2 - b.left;
  };

  // Смена вкладки: старый пузырь опускается за 0.3s, новый поднимается за 1s с упругим отскоком.
  useLayoutEffect(() => {
    const s = bump.current;
    cancelAnimationFrame(raf.current);
    const target = active ? PEAK : 0;
    const nx = active ? centerOf(active) : s.cx;
    const fromH = s.h;
    const changed = Math.abs(nx - s.cx) > 1;
    if (changed) Object.assign(s, { ox: s.cx, oh: fromH, cx: nx, h: 0 });
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      Object.assign(s, { h: target, oh: 0 });
      draw();
      return;
    }
    const start = changed ? 0 : fromH;
    const t0 = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / 1000);
      const tq = Math.min(1, (now - t0) / 300);
      s.h = start + (target - start) * (target ? elastic(t) : quart(tq));
      if (changed) s.oh = fromH * (1 - quart(tq));
      draw();
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [active, draw]);

  useEffect(() => {
    const onResize = () => {
      if (active) bump.current.cx = centerOf(active);
      draw();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [active, draw]);

  // Escape закрывает меню; страница под открытым меню не прокручивается.
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === 'Escape' && setMenuAt(null);
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [menuOpen]);

  useEffect(() => () => clearTimeout(drawTimer.current), []);

  const startDraw = (key) => {
    clearTimeout(drawTimer.current);
    setDrawing(key);
  };
  const stopDraw = (delay) => {
    clearTimeout(drawTimer.current);
    drawTimer.current = setTimeout(() => setDrawing(null), delay);
  };

  return (
    <div className={`mobile-only tabbar-root${menuOpen ? ' is-menu-open' : ''}`}>
      <nav className="tabbar-menu" aria-hidden={!menuOpen} inert={!menuOpen}>
        <ul className="tabbar-menu-list">
          {MENU_ITEMS.map((item, i) => (
            <li key={item.to} className={`tabbar-menu-item${item.gospel ? ' tabbar-menu-item--gospel' : ''}`} style={{ '--i': i }}>
              <Link to={item.to} onClick={() => setMenuOpen(false)}>
                {item.gospel && <span className="tabbar-menu-badge">Весть о спасении</span>}
                <span className="tabbar-menu-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="tabbar-menu-label">{item.label}</span>
                {item.gospel && <span className="tabbar-menu-arrow" aria-hidden="true">→</span>}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="tabbar" ref={barRef}>
        <svg className="tabbar-bump" ref={svgRef} viewBox="0 0 390 22" preserveAspectRatio="none" aria-hidden="true">
          <path ref={pathRef} />
        </svg>
        <div className="tabbar-inner">
          {TABS.map((tab, i) => [
            // Бургер стоит в ряду между второй и третьей вкладкой.
            i === 2 && (
              <button
                key="burger"
                type="button"
                className="tabbar-burger"
                aria-label="Меню"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(!menuOpen)}
              >
                <span className="tabbar-burger-icon"><span /><span /><span /></span>
              </button>
            ),
            <Link
              key={tab.key}
              ref={(el) => { tabRefs.current[tab.key] = el; }}
              to={tab.to}
              aria-label={tab.label}
              aria-current={active === tab.key ? 'page' : undefined}
              className={`tabbar-tab${active === tab.key ? ' is-active' : ''}${drawing === tab.key ? ' is-drawing' : ''}`}
              onPointerEnter={() => startDraw(tab.key)}
              onPointerDown={() => startDraw(tab.key)}
              onPointerLeave={() => stopDraw(0)}
              onPointerUp={() => stopDraw(900)}
              onClick={() => setMenuOpen(false)}
            >
              <TabIcon tab={tab} />
            </Link>,
          ])}
        </div>
      </div>
    </div>
  );
}

