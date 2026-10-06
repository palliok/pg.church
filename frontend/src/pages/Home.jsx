import { t, getLang, langPath } from '../i18n.js';
import { Link } from 'react-router-dom';
import { useLayoutEffect, useRef } from 'react';
import ArrowKnob from '../components/ArrowKnob.jsx';
import ChurchBrand from '../components/ChurchBrand.jsx';
import ContactsCard from '../components/ContactsCard.jsx';
import { duty, homeEvents } from '../data/mockData.js';

export default function Home() {
  const donationRef = useRef(null);
  const scheduleColumnRef = useRef(null);

  useLayoutEffect(() => {
    const donation = donationRef.current;
    const updateHeight = () => {
      scheduleColumnRef.current.style.setProperty('--donation-height', `${donation.getBoundingClientRect().height}px`);
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(donation);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="home-wrap page-enter container" style={{ paddingLeft: 0, paddingRight: 0, maxWidth: 'var(--content-max)' }}>
      <div className="home-mobile">
        <div className="home-mobile-header">
          <ChurchBrand />

          <div className="home-mobile-lang">
            {['RU', 'EN', 'KY'].map((lng) => {
              const code = lng.toLowerCase();
              const active = getLang() === code;

              return (
                <button
                  key={lng}
                  type="button"
                  className={active ? 'active' : ''}
                  onClick={() => { window.location.href = langPath(code); }}
                >
                  {lng}
                </button>
              );
            })}
          </div>
        </div>

        <Link to="/story/jesus" className="home-mobile-hero">
          <div className="home-mobile-hero-label">Евангелие</div>
          <div className="home-mobile-hero-meta">Фото · общение</div>
          <div className="home-mobile-hero-title">
            {getLang() === 'ky' ? null : <>{t('Кто')}<br />{t('такой')}<br /></>}
            <span>{t('Иисус?')}</span>
          </div>
          <p className="home-mobile-hero-text">
            Хорошая новость простыми словами — о том, почему это важно для тебя.
          </p>
          <span className="hero-cta">
            Читать как комикс
            <i><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 18 18 6M8 6h10v10" /></svg></i>
          </span>
        </Link>

        <Link to="/schedule/e28" className="home-mobile-next">
          <div style={{ minWidth: 0 }}>
            <div className="home-mobile-next-label">Ближайшее · 28 июня</div>
            <div className="home-mobile-next-title">Богослужение</div>
            <div className="home-mobile-next-meta">Воскресенье · 11:00 · Главный зал</div>
          </div>
          <span className="home-mobile-arrow">↗</span>
        </Link>

        <ContactsCard />
      </div>

      <div className="home-grid" style={{ padding: '0 18px' }}>

        <div className="home-left">
        {/* Евангелие */}
        <div
          className="home-hero"
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 24,
            backgroundColor: '#0d0d0d',
            backgroundImage:
              'linear-gradient(70deg, rgba(5,5,5,.92) 12%, rgba(5,5,5,.4) 62%, rgba(5,5,5,.15) 100%), repeating-linear-gradient(135deg, rgba(255,255,255,.035) 0 11px, transparent 11px 22px)',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: 40,
          }}
        >
          <div style={{ position: 'absolute', top: 26, left: 26, background: '#fff', color: '#0d0d0d', padding: '9px 14px', borderRadius: 11, fontFamily: 'var(--f-head)', fontWeight: 700, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase' }}>
            Евангелие
          </div>
          <div className="h-display" style={{ fontSize: 38 }}>
            Кто такой
            <span style={{ display: 'block', fontWeight: 900, fontSize: 'clamp(48px, 8vw, 112px)', lineHeight: 0.8, letterSpacing: '-.05em', marginTop: 8, color: 'var(--c-yellow)' }}>
              Иисус?
            </span>
          </div>
          <p style={{ font: '500 16px/1.5 var(--f-body)', color: 'rgba(255,255,255,.72)', maxWidth: 400, margin: '22px 0 0' }}>
            Хорошая новость простыми словами — о том, кто такой Иисус и почему это важно для тебя.
          </p>
          <a href="#gospel" className="pill-btn" style={{ alignSelf: 'flex-start', marginTop: 24, padding: '7px 7px 7px 26px', background: '#fff', color: '#0d0d0d' }}>
            <span style={{ fontSize: 13 }}>Подробнее</span>
            <ArrowKnob size={44} bg="#0d0d0d" fg="#fff" />
          </a>
        </div>

        {/* Адрес */}
        <ContactsCard className="home-address" />
        </div>

        {/* Пожертвование */}
        <div className="home-donate-column">
        <Link
          to="/donate"
          className="home-donate"
          ref={donationRef}
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 24,
            background: 'var(--c-yellow)',
            color: '#0d0d0d',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '22px 18px',
          }}
        >
          <div style={{ alignSelf: 'flex-start', background: '#0d0d0d', color: '#fff', padding: '7px 12px', borderRadius: 9, fontFamily: 'var(--f-head)', fontWeight: 700, fontSize: 9, letterSpacing: '.12em', textTransform: 'uppercase' }}>
            Пожертвование
          </div>
          <div>
            <div className="h-display" style={{ fontSize: 24, lineHeight: 0.92 }}>Поддержать<br />служение</div>
            <span className="pill-btn" style={{ marginTop: 16, padding: '6px 6px 6px 20px', background: '#0d0d0d', color: '#fff' }}>
              <span style={{ fontSize: 11.5 }}>Пожертвовать</span>
              <ArrowKnob size={34} bg="var(--c-yellow)" fg="#0d0d0d" />
            </span>
          </div>
        </Link>
        <img className="home-church-people" src="/church-people-details.png" alt="" />
        </div>

        <div className="home-schedule-column" ref={scheduleColumnRef}>
        <div className="home-church">
          <img src="/church-with-people-details.png" alt="" />
        </div>

        {/* Расписание */}
        <div className="home-schedule" style={{ borderRadius: 24, background: 'var(--c-panel)', padding: '20px 20px 16px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div className="h-display" style={{ fontSize: 26, whiteSpace: 'nowrap' }}>Расписание</div>
            <Link to="/schedule" aria-label={t('Всё расписание')}>
              <ArrowKnob size={38} as="span" />
            </Link>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', marginTop: 10 }}>
            {homeEvents.map((e) => (
              <Link key={e.id} to={`/schedule/${e.id}`} className="card-row" style={{ padding: '8px 0' }}>
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 46, height: 46, borderRadius: 14, background: '#0d0d0d', color: '#fff', flex: '0 0 auto' }}>
                  <span style={{ fontFamily: 'var(--f-head)', fontWeight: 800, fontSize: 16, lineHeight: 1 }}>{e.day}</span>
                  <span style={{ fontFamily: 'var(--f-head)', fontWeight: 700, fontSize: 7.5, letterSpacing: '.1em', opacity: 0.65, marginTop: 2 }}>{e.mon}</span>
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'block', fontFamily: 'var(--f-head)', fontWeight: 600, fontSize: 17, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.title}</span>
                  <span style={{ display: 'block', font: '500 11.5px var(--f-body)', color: 'var(--c-gray-text)', marginTop: 2 }}>{e.sub}</span>
                </span>
                <span style={{ color: 'var(--c-gray-text-mute)' }}>↗</span>
              </Link>
            ))}
          </div>
        </div>

        </div>

        {/* Кто мы */}
        <Link
          to="/about"
          className="home-about"
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 24,
            backgroundColor: '#0d0d0d',
            backgroundImage:
              'linear-gradient(to top, rgba(5,5,5,.93) 7%, rgba(5,5,5,.25) 54%, rgba(5,5,5,.45) 100%), repeating-linear-gradient(135deg, rgba(255,255,255,.035) 0 11px, transparent 11px 22px)',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: 26,
          }}
        >
          <div className="h-display" style={{ fontSize: 48 }}>Кто мы</div>
          <p style={{ font: '500 14px/1.5 var(--f-body)', color: 'rgba(255,255,255,.72)', maxWidth: 300, margin: '11px 0 0' }}>
            Наша история, во что мы верим и команда, которая ждёт именно тебя.
          </p>
          <div style={{ marginTop: 18, padding: 16, borderRadius: 18, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)' }}>
            <div style={{ fontFamily: 'var(--f-head)', fontWeight: 700, fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>
              Дежурство служителей · 10:00–18:00
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 12 }}>
              {duty.map((d) => (
                <div key={d.dow} className="card-row">
                  <span className="icon-circle" style={{ flex: '0 0 30px', height: 30, background: 'rgba(255,255,255,.12)', fontFamily: 'var(--f-head)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>
                    {d.dow}
                  </span>
                  <span style={{ font: '600 13.5px var(--f-body)', color: '#fff' }}>{d.name}</span>
                </div>
              ))}
            </div>
          </div>
        </Link>
      </div>

    </div>
  );
}
