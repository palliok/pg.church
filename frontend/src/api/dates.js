import { getLang, t } from '../i18n.js';

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

// Форматирует календарную дату { year, month, day }. Дата уже дана по времени
// церкви, поэтому форматируем её в UTC, не завися от часового пояса посетителя.
export function formatDate({ year, month, day }, lang, options) {
  return new Intl.DateTimeFormat(lang, { ...options, timeZone: 'UTC' }).format(new Date(Date.UTC(year, month - 1, day)));
}

// День и месяц на языке сайта: «18 октября», «October 18», «18-октябрь».
// Для киргизского в Chrome нет данных Intl — месяц берём из словаря.
export function dayLabel(date) {
  const lang = getLang();

  return lang === 'ky'
    ? `${date.day}-${t(MONTHS[date.month - 1]).toLowerCase()}`
    : formatDate(date, lang, { day: 'numeric', month: 'long' });
}

// Дата из строки ISO 8601 в том виде, как она записана: «2026-10-10T12:00:00+03:00» → 10 октября.
export function isoDate(iso) {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);

  return { year, month, day };
}
