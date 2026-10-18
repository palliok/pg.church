import { useChurch } from '../api/church.js';
import { t } from '../i18n.js';
import './ContactsCard.css';

const MAP_URL = 'https://yandex.ru/maps/-/CXeDE0zH';
const MAP_EMBED_URL = 'https://yandex.ru/map-widget/v1/?um=constructor%3A406ce76e3eab2cea5d9dd707c1d06b8a569aac16f7129a3526693a2407a42d39&source=constructor';

export default function ContactsCard({ className = '' }) {
  const church = useChurch();

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
        <div className="contacts-card-address">{church?.address}</div>

        {church?.metro && (
          <div className="contacts-card-info">
            <div className="contacts-card-metro">
              <span className="contacts-card-metro-icon">М</span>
              {church.metro}
            </div>
          </div>
        )}

        <div className="contacts-card-bottom">
          {church?.phone && (
            <a href={church.phoneHref} className="contacts-card-phone" aria-label={`${t('Позвонить')}: ${church.phone}`}>
              <span className="contacts-card-phone-icon">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M6.6 10.8a15.1 15.1 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1L6.6 10.8Z" />
                </svg>
              </span>
              {church.phone}
            </a>
          )}
          <div className="contacts-card-socials">
            {(church?.social ?? []).map((s) => (
              <a key={s.code} href={s.href} title={s.label} target="_blank" rel="noreferrer" className="contacts-card-social icon-circle">
                {s.code}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
