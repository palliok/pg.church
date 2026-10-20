import { Link } from 'react-router-dom';
import { useAnnouncements } from '../api/announcements.js';
import { Megaphone } from './AnnouncementCards.jsx';
import './Announcements.css';

// Блок объявлений на главной: последнее объявление чёрной карточкой, под ней —
// краешки следующих (стопка) и кнопка «Все объявления». Пока объявлений нет,
// блок не показывается.
export default function Announcements({ className = '' }) {
  const { items } = useAnnouncements();
  const latest = items[0];

  if (!latest) return null;

  return (
    <section className={`ann-home ${className}`}>
      <Link to="/announcements" className="ann-home-card">
        <Megaphone />
        {latest.dateLabel && <span className="ann-home-date">{latest.dateLabel}</span>}
        <span className="ann-home-title">{latest.title}</span>
        <span className="ann-home-more">Подробнее</span>
      </Link>
      {items.length > 1 && <span className="ann-home-layer is-first" aria-hidden="true" />}
      {items.length > 2 && <span className="ann-home-layer is-second" aria-hidden="true" />}
      <div className="ann-home-foot">
        <Link to="/announcements" className="ann-home-all">Все объявления</Link>
      </div>
    </section>
  );
}
