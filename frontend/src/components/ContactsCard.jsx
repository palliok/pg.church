import { church } from '../data/mockData.js';
import { t } from '../i18n.js';
import ContactMap from './ContactMap.jsx';
import './ContactsCard.css';

export default function ContactsCard({ className = '' }) {
  return (
    <div className={`contacts-card ${className}`}>
      <ContactMap />
      <div className="contacts-card-body">
        <div className="contacts-card-address">{t('ул.')} {church.address}</div>
        <div className="contacts-card-info">
          <div className="contacts-card-metro">
            <span className="contacts-card-metro-icon" aria-hidden="true">М</span>
            {church.metro}
          </div>
          <a href={church.phoneHref} className="contacts-card-phone">{church.phone}</a>
        </div>
      </div>
    </div>
  );
}
