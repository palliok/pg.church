import { t, getLang } from '../i18n.js';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Announcements from '../components/Announcements.jsx';
import HomeSchedule, { ScheduleCarousel } from '../components/HomeSchedule.jsx';
import ContactsCard from '../components/ContactsCard.jsx';
import HomeAbout from '../components/HomeAbout.jsx';
import { daysFromToday } from '../api/dates.js';
import { useEvents } from '../api/events.js';
import gospelTitle from '../assets/gospel-title.png';
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

        <HomeAbout />

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

        {/* Правая колонка: блог и «О церкви» с личными беседами. */}
        <div className="home-right">
        {/* Блог ещё не готов: плитка-заглушка без ссылки. Пожертвовать можно через «Поддержать» в шапке. */}
        <div className="home-blog-column">
        <div className="home-blog" aria-disabled="true">
          <span className="home-blog-head">
            <span className="home-blog-soon">В разработке</span>
            <span className="home-blog-title">Блог</span>
          </span>
          <span className="home-blog-line">Скоро здесь появятся первые записи</span>
        </div>
        </div>

        <HomeAbout />
        </div>
      </div>

    </div>
  );
}
