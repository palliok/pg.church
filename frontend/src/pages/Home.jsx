import { t, getLang, langPath } from '../i18n.js';
import { Link } from 'react-router-dom';
import Announcements from '../components/Announcements.jsx';
import ArrowKnob from '../components/ArrowKnob.jsx';
import ChurchBrand from '../components/ChurchBrand.jsx';
import ContactsCard from '../components/ContactsCard.jsx';
import { useChurch } from '../api/church.js';
import { useEvents } from '../api/events.js';

export default function Home() {
  const { events: homeEvents, error: eventsError } = useEvents({ limit: 12 });
  const nextEvent = homeEvents[0];
  const duty = useChurch()?.duty;

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
          <div className="home-mobile-hero-title">
            {getLang() === 'ky' ? null : <>{t('Кто такой')}<br /></>}
            <span>{t('Иисус?')}</span>
          </div>
          <p className="home-mobile-hero-text">
            Всё началось задолго до сотворения мира. И с тех пор вся история связана с Ним.
          </p>
        </Link>

        {nextEvent && (
          <Link to={`/schedule/${nextEvent.id}`} className="home-mobile-next">
            <div style={{ minWidth: 0 }}>
              <div className="home-mobile-next-label">{t('Ближайшее')} · {nextEvent.dateLabel}</div>
              <div className="home-mobile-next-title">{nextEvent.title}</div>
              <div className="home-mobile-next-meta">{nextEvent.when}</div>
            </div>
            <span className="home-mobile-arrow">↗</span>
          </Link>
        )}

        <Announcements />

        <ContactsCard />
      </div>

      <div className="home-grid" style={{ padding: '0 18px' }}>

        <div className="home-left">
        <div className="home-top-left">
        {/* Евангелие */}
        {/* Текст сверху, чтобы внизу картинки были видны Иисус и дети. */}
        <Link
          to="/story/jesus"
          className="home-hero"
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 24,
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            padding: 32,
            textDecoration: 'none',
          }}
        >
          <div className="h-display" style={{ fontSize: 28 }}>
            Кто такой
            <span style={{ display: 'block', fontWeight: 900, fontSize: 'clamp(44px, 5vw, 72px)', lineHeight: 0.85, letterSpacing: '-.05em', marginTop: 6, color: 'var(--c-main)' }}>
              Иисус?
            </span>
          </div>
          {/* Узкая колонка — чтобы текст не заходил на Иисуса справа. */}
          <p style={{ font: '500 15px/1.5 var(--f-body)', color: 'rgba(255,255,255,.8)', maxWidth: 240, margin: '14px 0 0' }}>
            Всё началось задолго до сотворения мира. И с тех пор вся история связана с Ним.
          </p>
        </Link>
        </div>

        {/* Адрес */}
        <ContactsCard className="home-address" />
        </div>

        <div className="home-schedule-column">
        {/* Объявления */}
        <Announcements className="home-announcements" />

        {/* Расписание */}
        <div className="home-schedule" style={{ borderRadius: 24, background: 'var(--c-panel)', padding: '20px 20px 16px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div className="h-display" style={{ fontSize: 26, whiteSpace: 'nowrap' }}>Расписание</div>
            <Link to="/schedule" aria-label={t('Всё расписание')}>
              <ArrowKnob size={38} as="span" />
            </Link>
          </div>
          <div className="home-schedule-list" style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: 10 }}>
            {homeEvents.map((e) => (
              <Link
                key={e.id}
                to={`/schedule/${e.id}`}
                className={`home-sched-row${e.main ? ' is-main' : ''}${['Молодёжь', 'Дети'].includes(e.category) ? ' is-peach' : ''}`}
              >
                <span className="home-sched-chip">
                  <span className="home-sched-day">{e.day}</span>
                  <span className="home-sched-mon">{e.mon}</span>
                </span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="home-sched-title">{e.title}</span>
                  <span className="home-sched-sub">{[e.dowLabel, e.timeRange].filter(Boolean).join(' · ')}</span>
                </span>
                <span className="home-sched-knob" aria-hidden="true">↗</span>
              </Link>
            ))}
            {eventsError && (
              <div role="alert" style={{ font: '500 12.5px/1.5 var(--f-body)', color: 'var(--c-gray-text)' }}>Не удалось загрузить данные.</div>
            )}
          </div>
        </div>

        </div>

        <div className="home-right">
        {/* Пожертвование */}
        <div className="home-donate-column">
        <Link
          to="/donate"
          className="home-donate"
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 24,
            background: 'var(--c-main)',
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
              <ArrowKnob size={34} bg="var(--c-main)" fg="#0d0d0d" />
            </span>
          </div>
        </Link>
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
          {duty?.shifts.length > 0 && (
          <div style={{ marginTop: 18, padding: 16, borderRadius: 18, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.15)' }}>
            <div style={{ fontFamily: 'var(--f-head)', fontWeight: 700, fontSize: 8.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.5)' }}>
              {[t('Дежурство служителей'), duty.hours].filter(Boolean).join(' · ')}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 12 }}>
              {duty.shifts.map((d, i) => (
                <div key={i} className="card-row">
                  <span className="icon-circle" style={{ flex: '0 0 30px', height: 30, background: 'rgba(255,255,255,.12)', fontFamily: 'var(--f-head)', fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>
                    {d.dow}
                  </span>
                  <span style={{ font: '600 13.5px var(--f-body)', color: '#fff' }}>{d.name}</span>
                </div>
              ))}
            </div>
          </div>
          )}
        </Link>
        </div>
      </div>

    </div>
  );
}
