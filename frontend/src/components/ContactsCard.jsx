import { useChurch } from '../api/church.js';
import { t } from '../i18n.js';
import { PhoneIcon } from './Icons.jsx';
import './ContactsCard.css';

const MAP_URL = 'https://yandex.ru/maps/-/CXeDE0zH';
const MAP_EMBED_URL = 'https://yandex.ru/map-widget/v1/?um=constructor%3A406ce76e3eab2cea5d9dd707c1d06b8a569aac16f7129a3526693a2407a42d39&source=constructor';

// Метро «Озерки · 7 минут пешком» по частям: станция, число минут и остаток подписи.
// Если подпись другого вида — станцией считается она вся.
function metroParts(metro) {
  const [station, walk] = metro.split(' · ');
  const match = walk?.match(/^(\d+)\s+(.+)$/);

  return { station, minutes: match?.[1] ?? null, rest: match ? match[2] : walk ?? null };
}

// Блок «Адрес»: карта сверху, под ней плашка с адресом, метро, телефоном и соцсетями
// (оформление — макет design_handoff_overview, блок 13). Раскладка плашки зависит от ширины самого блока:
// он стоит и в узких колонках, и на всю ширину.
export default function ContactsCard({ className = '' }) {
  const church = useChurch();
  const metro = church?.metro ? metroParts(church.metro) : null;

  return (
    <div className={`contacts-card ${className}`}>
      <div className="contacts-card-inner">
        <div className="contacts-card-map">
          <iframe src={MAP_EMBED_URL} title="Яндекс Карта" />
        </div>

        <div className="contacts-card-plate">
          <div className="contacts-card-place">
            {/* Адрес открывает карту целиком — там можно построить маршрут. */}
            <a href={MAP_URL} target="_blank" rel="noreferrer" title={t('На карте')} className="contacts-card-address">
              {church?.address}
            </a>

            {metro && (
              <div className="contacts-card-metro">
                <span className="contacts-card-metro-icon">М</span>
                <span>{metro.station}</span>
                {metro.rest && <span className="contacts-card-metro-dot" aria-hidden="true" />}
                {metro.minutes && <span className="contacts-card-metro-num">{metro.minutes}</span>}
                {metro.rest && <span className="contacts-card-metro-rest">{metro.rest}</span>}
              </div>
            )}
          </div>

          <div className="contacts-card-actions">
            {church?.phone && (
              <a href={church.phoneHref} className="contacts-card-phone" aria-label={`${t('Позвонить')}: ${church.phone}`}>
                <PhoneIcon />
                <span>{church.phone}</span>
              </a>
            )}
            {(church?.social ?? []).map((s) => (
              <a key={s.code} href={s.href} title={s.label} target="_blank" rel="noreferrer" className="contacts-card-social">
                {s.code}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
