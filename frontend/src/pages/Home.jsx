import { t, getLang } from '../i18n.js';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Announcements from '../components/Announcements.jsx';
import HomeSchedule, { ScheduleCarousel } from '../components/HomeSchedule.jsx';
import ContactsCard from '../components/ContactsCard.jsx';
import { useChurch } from '../api/church.js';
import { daysFromToday } from '../api/dates.js';
import { useEvents } from '../api/events.js';
import gospelTitle from '../assets/gospel-title.png';
import donateTitle from '../assets/donate-title.png';
import './Home.css';

// Текущее время, обновляется раз в минуту: «через 3 ч» и прошедшие события на главной.
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

        {/* Второстепенный блок: пока грузится и при ошибке не показываем. Без событий на неделе
            остаётся карточка «В календарь». */}
        {!eventsLoading && !eventsError && <ScheduleCarousel events={week} now={now} />}

        <Announcements />

        <ContactsCard />
      </div>

      {/* Десктоп: три колонки, у каждой своя стопка блоков. */}
      <div className="home-grid">
        <div className="home-left">
        {/* Евангелие: подпись сверху, вопрос внизу на холмах — между ними Иисус с детьми. */}
        <Link to="/story/jesus" className="home-hero">
          {/* Узкая колонка — чтобы текст не заходил на Иисуса справа. */}
          <p className="home-hero-text">
            Всё началось задолго до сотворения мира. И с тех пор вся история связана с Ним.
          </p>
          {titleImage ? (
            <img className="home-hero-title-img" src={gospelTitle} alt="Кто такой Иисус?" />
          ) : (
            <div className="h-display home-hero-title">
              {/* На киргизском вопрос — одна фраза «Иса ким?», без «Кто такой». */}
              {getLang() === 'ky' ? null : t('Кто такой')}
              <span>{t('Иисус?')}</span>
            </div>
          )}
        </Link>

        <ContactsCard className="home-address" />
        </div>

        <div className="home-center">
        <Announcements className="home-announcements" />

        <HomeSchedule className="home-schedule" events={upcoming} loading={eventsLoading} error={eventsError} now={now} />
        </div>

        {/* Правая колонка: пожертвование и «Кто мы». */}
        <div className="home-right">
        {/* Пожертвование: рука вдовы опускает две лепты в сокровищницу. Подпись и надпись сверху, кнопка внизу. */}
        <div className="home-donate-column">
        <Link to="/donate" className="home-donate">
          <span className="home-donate-head">
            <span className="home-label">Пожертвование</span>
            {titleImage ? (
              <img className="home-donate-title-img" src={donateTitle} alt="Поддержать служение" />
            ) : (
              <span className="home-donate-title">Поддержать служение</span>
            )}
          </span>
          <span className="home-pill is-dark is-small home-donate-pill">
            Пожертвовать
            <span className="home-pill-knob">↗</span>
          </span>
        </Link>
        </div>

        <Link to="/about" className="home-about">
          <span className="home-knob is-light home-about-knob">↗</span>
          <span className="home-about-motto">«Прославлять Бога, живя по&nbsp;Его слову»</span>
          <span className="home-about-title">Кто мы</span>
          <p className="home-about-text">Наша история, во что мы верим и команда, которая ждёт именно тебя.</p>
          {duty?.shifts.length > 0 && (
            <span className="home-duty">
              <span className="home-label">{[t('Дежурство служителей'), duty.hours].filter(Boolean).join(' · ')}</span>
              <span className="home-duty-list">
                {duty.shifts.map((d, i) => (
                  <span key={i} className="home-duty-row">
                    <span className="home-duty-dow">{d.dow}</span>
                    <span className="home-duty-name">{d.name}</span>
                  </span>
                ))}
              </span>
            </span>
          )}
        </Link>
        </div>
      </div>

    </div>
  );
}
