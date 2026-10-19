import { useChurch } from '../api/church.js';
import { t } from '../i18n.js';
import './ContactsCard.css';

const MAP_URL = 'https://yandex.ru/maps/-/CXeDE0zH';
const MAP_EMBED_URL = 'https://yandex.ru/map-widget/v1/?um=constructor%3A406ce76e3eab2cea5d9dd707c1d06b8a569aac16f7129a3526693a2407a42d39&source=constructor';

// Блок «Адрес»: карта сверху, под ней адрес и метро, телефон и соцсети.
// Раскладка зависит от ширины самого блока, а не экрана: он стоит и в узких колонках, и на всю ширину.
export default function ContactsCard({ className = '' }) {
  const church = useChurch();

  return (
    <div className={`contacts-card ${className}`}>
      <div className="contacts-card-map">
        <iframe src={MAP_EMBED_URL} title="Яндекс Карта" />
      </div>

      <div className="contacts-card-body">
        <div className="contacts-card-place">
          {/* Адрес открывает карту целиком — там можно построить маршрут. */}
          <a href={MAP_URL} target="_blank" rel="noreferrer" title={t('На карте')} className="contacts-card-address">
            {church?.address}
          </a>

          {church?.metro && (
            <div className="contacts-card-metro">
              <span className="contacts-card-metro-icon">М</span>
              {church.metro}
            </div>
          )}
        </div>

        <div className="contacts-card-actions">
          {church?.phone && (
            <a href={church.phoneHref} className="contacts-card-phone" aria-label={`${t('Позвонить')}: ${church.phone}`}>
              {church.phone}
            </a>
          )}
          {(church?.social ?? []).map((s) => (
            <a key={s.code} href={s.href} title={s.label} target="_blank" rel="noreferrer" className="contacts-card-social icon-circle">
              {s.code}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
