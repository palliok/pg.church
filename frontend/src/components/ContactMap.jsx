import { getLang, t } from '../i18n.js';
import { church } from '../data/mockData.js';
import ArrowKnob from './ArrowKnob.jsx';
import './ContactMap.css';

const MAP_ID = '406ce76e3eab2cea5d9dd707c1d06b8a569aac16f7129a3526693a2407a42d39';

export default function ContactMap() {
  const lang = getLang() === 'en' ? 'en_RU' : 'ru_RU';

  return (
    <a
      className="contact-map"
      href="https://yandex.ru/maps/-/CXEZRW61"
      target="_blank"
      rel="noreferrer"
      aria-label={`${t('На карте')}: ${church.address}`}
    >
      <img
        src={`https://api-maps.yandex.ru/services/constructor/1.0/static/?um=constructor%3A${MAP_ID}&width=600&height=450&lang=${lang}`}
        width="600"
        height="450"
        alt=""
        loading="lazy"
      />
      <span className="contact-map-label">{t('Мы здесь')}</span>
      <span className="contact-map-button pill-btn">
        {t('На карте')}
        <ArrowKnob size={30} bg="#fff" fg="#0d0d0d" />
      </span>
    </a>
  );
}
