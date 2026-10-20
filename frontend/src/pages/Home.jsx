import { t, getLang, langPath } from '../i18n.js';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Announcements from '../components/Announcements.jsx';
import ArrowKnob from '../components/ArrowKnob.jsx';
import HomeSchedule, { ScheduleCarousel } from '../components/HomeSchedule.jsx';
import ChurchBrand from '../components/ChurchBrand.jsx';
import ContactsCard from '../components/ContactsCard.jsx';
import { useChurch } from '../api/church.js';
import { daysFromToday } from '../api/dates.js';
import { useEvents } from '../api/events.js';
import gospelTitle from '../assets/gospel-title.png';

// Текущее время, обновляется раз в минуту: «через 3 часа» и прошедшие события на главной.
function useNow() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  return now;
}

export default function Home() {
  const { events: homeEvents, loading: eventsLoading, error: eventsError } = useEvents({ limit: 30 });
  const now = useNow();
  // API отдаёт события с начала сегодняшнего дня — закончившиеся сегодня убираем.
  // Событие на весь день без окончания идёт до конца своего дня.
  const upcoming = useMemo(() => homeEvents.filter((e) => (e.allDay && !e.endsAt ? daysFromToday(e) >= 0 : Date.parse(e.endsAt ?? e.startsAt) > now)), [homeEvents, now]);
  // Карусель на телефоне — события на неделю вперёд от текущего момента.
  const week = useMemo(() => upcoming.filter((e) => Date.parse(e.startsAt) < now + 7 * 86_400_000), [upcoming, now]);
  const duty = useChurch()?.duty;
  // Вопрос «Кто такой Иисус?» нарисован картинкой только по-русски, на en/ky — текстом.
  const titleImage = getLang() === 'ru';

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
          <p className="home-mobile-hero-text">
            Всё началось задолго до сотворения мира. И с тех пор вся история связана с Ним.
          </p>
          {titleImage ? (
            <img className="home-hero-title-img" src={gospelTitle} alt="Кто такой Иисус?" />
          ) : (
            <div className="home-mobile-hero-title">
              {getLang() === 'ky' ? null : <>{t('Кто такой')}<br /></>}
              <span>{t('Иисус?')}</span>
            </div>
          )}
        </Link>

        {/* Только после загрузки: иначе прокрутка с привязкой зацепится за «В календарь» и уедет в конец. */}
        {!eventsLoading && !eventsError && <ScheduleCarousel events={week} now={now} />}

        <Announcements />

        <ContactsCard />
      </div>

      <div className="home-grid" style={{ padding: '0 18px' }}>

        <div className="home-left">
        <div className="home-top-left">
        {/* Евангелие */}
        {/* Подпись сверху, вопрос внизу на холмах — между ними Иисус с детьми. */}
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
          {/* Узкая колонка — чтобы текст не заходил на Иисуса справа. */}
          <p style={{ font: '500 16px/1.45 var(--f-body)', color: 'rgba(255,255,255,.65)', maxWidth: 240, margin: 0, textWrap: 'balance' }}>
            Всё началось задолго до сотворения мира. И с тех пор вся история связана с Ним.
          </p>
          {titleImage ? (
            <img className="home-hero-title-img" src={gospelTitle} alt="Кто такой Иисус?" />
          ) : (
            <div className="h-display" style={{ fontSize: 34, marginTop: 'auto', paddingTop: 24 }}>
              Кто такой
              <span style={{ display: 'block', fontWeight: 900, fontSize: 'clamp(56px, 6.5vw, 96px)', lineHeight: 0.85, letterSpacing: '-.05em', marginTop: 4, color: 'var(--c-main)' }}>
                Иисус?
              </span>
            </div>
          )}
        </Link>
        </div>

        {/* Адрес */}
        <ContactsCard className="home-address" />
        </div>

        <div className="home-schedule-column">
        {/* Объявления */}
        <Announcements className="home-announcements" />

        {/* Расписание */}
        <HomeSchedule className="home-schedule" events={upcoming} loading={eventsLoading} error={eventsError} now={now} />

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
