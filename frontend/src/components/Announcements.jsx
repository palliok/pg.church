import { Link } from 'react-router-dom';
import { useAnnouncements } from '../api/announcements.js';
import { Megaphone } from './AnnouncementCards.jsx';
import LongArrow from './LongArrow.jsx';
import './Announcements.css';

// Блок объявлений на главной (макет design_handoff_overview, блоки 02 и 03): последнее объявление
// чёрной карточкой, под ней — краешки следующих (стопка) и кнопка «Все объявления».
// Пока объявлений нет, блок не показывается.
export default function Announcements({ className = '' }) {
  const { items } = useAnnouncements();
  const latest = items[0];

  if (!latest) return null;

  return (
    <section className={`ann-home ${className}`}>
      <Link to="/announcements" className="ann-home-card">
        <Megaphone />
        <span className="ann-home-head">
          {latest.important && <span className="ann-home-important">Важно</span>}
          <span className="ann-home-title">{latest.title}</span>
        </span>
        {latest.eventDate && <AnnouncementDate date={latest.eventDate} />}
        <span className="ann-home-more">
          Подробнее
          <LongArrow />
        </span>
      </Link>
      {items.length > 1 && <span className="ann-home-layer is-first" aria-hidden="true" />}
      {items.length > 2 && <span className="ann-home-layer is-second" aria-hidden="true" />}
      <div className="ann-home-foot">
        <Link to="/announcements" className="ann-home-all">
          Все объявления
          <LongArrow />
        </Link>
      </div>
    </section>
  );
}

// День события: день недели над числом, рядом месяц — «ВТ / 14 ИЮЛ».
function AnnouncementDate({ date }) {
  return (
    <span className="ann-home-date">
      <span className="ann-home-dow">{date.dow}</span>
      <span className="ann-home-day">
        <span className="ann-home-num">{date.day}</span>
        <span className="ann-home-mon">{date.mon}</span>
      </span>
    </span>
  );
}
