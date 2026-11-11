import { Link } from 'react-router-dom';
import { useAnnouncements } from '../api/announcements.js';
import { AnnouncementDates, Megaphone } from './AnnouncementCards.jsx';
import LongArrow from './LongArrow.jsx';
import './Announcements.css';

// Блок объявлений на главной (макет design_handoff_overview, блоки 02 и 03): последнее объявление
// чёрной карточкой.
// Карточка ведёт на это объявление: на телефоне открываются его сторис, на десктопе — его карточка справа;
// закрыл сторис — остаёшься в списке объявлений.
// Пока объявлений нет, блок не показывается.
export default function Announcements({ className = '' }) {
  const { items } = useAnnouncements();
  const latest = items[0];

  if (!latest) return null;

  return (
    <section className={`ann-home ${className}`}>
      <Link to={`/announcements?a=${latest.id}`} className="ann-home-card">
        <Megaphone />
        <span className="ann-home-head">
          {latest.important && <span className="ann-home-important">Важно</span>}
          <span className="ann-home-title">{latest.title}</span>
        </span>
        <AnnouncementDates item={latest} />
        <span className="ann-home-more">
          Подробнее
          <LongArrow />
        </span>
      </Link>
    </section>
  );
}

