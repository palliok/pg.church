import { Link } from 'react-router-dom';
import { useAnnouncements } from '../api/announcements.js';
import { t } from '../i18n.js';
import './Announcements.css';

// «1 новое объявление», «3 новых объявления», «5 новых объявлений».
function countWords(n) {
  const mod10 = n % 10;
  const mod100 = n % 100;

  if (mod10 === 1 && mod100 !== 11) return [t('Новое'), t('объявление')];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return [t('Новых'), t('объявления')];
  return [t('Новых'), t('объявлений')];
}

// Блок объявлений на главной: число новых объявлений и их список.
// Всё ведёт на страницу объявлений; пока новых нет, блок не показывается.
export default function Announcements({ className = '' }) {
  const { fresh } = useAnnouncements();

  if (fresh.length === 0) return null;

  const [first, second] = countWords(fresh.length);

  return (
    <section className={`ann-home ${className}`}>
      <div className="ann-home-head">
        <div className="ann-home-count">
          <span className="ann-home-num">{fresh.length}</span>
          <span className="ann-home-words">{first}<br />{second}</span>
        </div>
        <Link to="/announcements" className="ann-home-knob" aria-label={t('Все объявления')}>↗</Link>
      </div>
      <div className="ann-home-list">
        {fresh.map((item) => (
          <Link key={item.id} to="/announcements" className="ann-home-row">
            {item.day && <span className="ann-home-date">{item.day} {item.mon}</span>}
            <span className="ann-home-title">{item.title}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
