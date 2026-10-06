import { church } from '../data/mockData.js';
import './ContactsCard.css';

const MAP_URL = 'https://yandex.ru/maps/-/CXeDE0zH';
const MAP_EMBED_URL = 'https://yandex.ru/map-widget/v1/?um=constructor%3A406ce76e3eab2cea5d9dd707c1d06b8a569aac16f7129a3526693a2407a42d39&source=constructor';

export default function ContactsCard({ className = '' }) {
  return (
    <div className={`contacts-card ${className}`}>
      <div className="contacts-card-map">
        <iframe src={MAP_EMBED_URL} title="Яндекс Карта" />
        <a href={MAP_URL} target="_blank" rel="noreferrer" className="contacts-card-button">
          На карте
          <span className="contacts-card-button-arrow">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 18 18 6M8 6h10v10" />
            </svg>
          </span>
        </a>
      </div>

      <div className="contacts-card-body">
        <div className="contacts-card-address">
          Большая<br />Озёрная, 27
        </div>

        <div className="contacts-card-info">
          <div className="contacts-card-metro">
            <span className="contacts-card-metro-icon">М</span>
            {church.metro}
          </div>
        </div>

        <div className="contacts-card-bottom">
          <a href={church.phoneHref} className="contacts-card-phone">{church.phone}</a>
          <div className="contacts-card-socials">
            {church.social.map((s) => (
              <a key={s.code} href={s.href} title={s.label} className="contacts-card-social icon-circle">
                {s.code}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
