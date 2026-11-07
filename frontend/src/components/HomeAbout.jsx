import { Link } from 'react-router-dom';
import { t } from '../i18n.js';
import LongArrow from './LongArrow.jsx';
import TalksCard from './TalksCard.jsx';
import './HomeAbout.css';

// Блок «О церкви» на главной — в пару к расписанию: сверху светлая карточка-ссылка на страницу
// «О церкви» с годом основания на фоне, под ней карточка личных бесед со служителями.
export default function HomeAbout({ className = '' }) {
  return (
    <div className={`home-about ${className}`}>
      <Link to="/about" className="home-about-card">
        <span className="home-about-year" aria-hidden="true">1864</span>
        <span className="home-about-since">С 1864 года</span>
        <span className="home-about-motto">{t('«Прославлять Бога, живя по Его слову»')}</span>
        <span className="home-about-title">
          О церкви
          <LongArrow width={28} stroke={2.6} />
        </span>
      </Link>

      <TalksCard />
    </div>
  );
}
