import { Link } from 'react-router-dom';
import { useAnnouncements } from '../api/announcements.js';
import { AnnouncementDates, Megaphone } from './AnnouncementCards.jsx';
import LongArrow from './LongArrow.jsx';
import './Announcements.css';

// Блок объявлений на главной (макет design_handoff_overview, блоки 02 и 03): объявление, выбранное
// в админке («На главной»), а если не выбрано — последнее, чёрной карточкой.
// Карточка ведёт на это объявление: на телефоне открываются его сторис, на десктопе — его карточка справа;
// закрыл сторис — остаёшься в списке объявлений.
// Пока объявлений нет, блок не показывается.
export default function Announcements({ className = '' }) {
  const { items } = useAnnouncements();
  const shown = items.find((item) => item.isMain) ?? items[0];

  if (!shown) return null;

  return (
    <section className={`ann-home ${className}`}>
      <Link to={`/announcements?a=${shown.id}`} className="ann-home-card">
        <Megaphone />
        <span className="ann-home-head">
          {shown.important && <span className="ann-home-important">Важно</span>}
          <span className="ann-home-title">{shown.title}</span>
        </span>
        <AnnouncementDates item={shown} />
        <span className="ann-home-more">
          Подробнее
          <LongArrow />
        </span>
      </Link>
    </section>
  );
}

