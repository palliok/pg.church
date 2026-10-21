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

// Месяц под числом дня: «июня», «June», «июнь».
// Для киргизского в Chrome нет данных Intl — месяц берём из словаря.
export function monthLabel(date) {
  const lang = getLang();
  if (lang === 'ky') return t(MONTHS[date.month - 1]).toLowerCase();

  return formatDate(date, lang, { day: 'numeric', month: 'long' }).replace(/\d+/, '').trim();
}

// Дата из строки ISO 8601 в том виде, как она записана: «2026-10-10T12:00:00+03:00» → 10 октября.
export function isoDate(iso) {
  const [year, month, day] = iso.slice(0, 10).split('-').map(Number);

  return { year, month, day };
}

// Время из строки ISO 8601 в том виде, как оно записано: «2026-10-10T12:00:00+03:00» → «12:00».
export function isoTime(iso) {
  return iso.slice(11, 16);
}

// Сегодняшняя дата по времени церкви — от неё считаются «Сегодня» и текущий месяц.
export function churchToday() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Moscow', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const [year, month, day] = parts.split('-').map(Number);

  return { year, month, day };
}

// Сколько дней от сегодняшнего дня (по времени церкви) до даты: 0 — сегодня, 1 — завтра, −1 — вчера.
export function daysFromToday({ year, month, day }) {
  const today = churchToday();

  return Math.round((Date.UTC(year, month - 1, day) - Date.UTC(today.year, today.month - 1, today.day)) / 86_400_000);
}

// День события относительно сегодня: «Сегодня», «Завтра» или «Сб 27».
export function relativeDay(event) {
  const days = daysFromToday(event);
  if (days === 0) return t('Сегодня');
  if (days === 1) return t('Завтра');

  return `${event.dowShort} ${event.day}`;
}

// Сколько осталось до начала: «через 40 мин», «через 3 ч» или «идёт сейчас».
// Считается только в пределах суток; для прошедших, дальних событий и событий на весь день — null.
export function startsIn(event, { now = Date.now() } = {}) {
  if (event.allDay) return null;

  const start = Date.parse(event.startsAt);
  const end = event.endsAt ? Date.parse(event.endsAt) : start;
  if (now >= start) return now < end ? t('идёт сейчас') : null;

  const minutes = Math.ceil((start - now) / 60_000);
  if (minutes >= 24 * 60) return null;

  return minutes < 60 ? inTime(minutes, 'min') : inTime(Math.round(minutes / 60), 'h');
}

// «через N мин/ч» на языке сайта: словарём такое не перевести — число стоит внутри фразы.
function inTime(n, unit) {
  switch (getLang()) {
    case 'en':
      return `in ${n} ${unit}`;
    case 'ky':
      return `${n} ${unit === 'min' ? 'мүнөттөн' : 'сааттан'} кийин`;
    default:
      return `через ${n} ${unit === 'min' ? 'мин' : 'ч'}`;
  }
}
