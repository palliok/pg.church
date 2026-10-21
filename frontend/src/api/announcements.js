import { useMemo } from 'react';
import { getLang, t } from '../i18n.js';
import { dayLabel, formatDate, isoDate, monthLabel, shortDate } from './dates.js';
import { useApi } from './useApi.js';

const WEEKDAYS = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

// День события для карточки: «28 июня, суббота», «June 28, Saturday».
function eventLabel(date) {
  const lang = getLang();
  const weekday = lang === 'ky'
    ? t(WEEKDAYS[new Date(Date.UTC(date.year, date.month - 1, date.day)).getUTCDay()])
    : formatDate(date, lang, { weekday: 'long' });

  // По-английски день недели с заглавной: «June 28, Saturday».
  return `${dayLabel(date)}, ${lang === 'en' ? weekday : weekday.toLowerCase()}`;
}

// Конкретный день события { day, month, label, dow, mon } или null, если объявление без даты.
// dow и mon — короткие подписи для плашки даты на главной.
function toEventDate(value) {
  if (!value) return null;
  const date = isoDate(value);

  return { day: date.day, month: monthLabel(date), label: eventLabel(date), ...shortDate(date) };
}

// «7 дней», «7 days», «7 күн» — длительность события с датами «с … по …».
function daysLabel(n) {
  switch (getLang()) {
    case 'en':
      return `${n} ${n === 1 ? 'day' : 'days'}`;
    case 'ky':
      return `${n} күн`;
    default: {
      const a = n % 10;
      const b = n % 100;
      const form = a === 1 && b !== 11 ? 0 : a >= 2 && a <= 4 && (b < 10 || b >= 20) ? 1 : 2;
      return `${n} ${['день', 'дня', 'дней'][form]}`;
    }
  }
}

// Сколько дней занимает событие с from по to включительно (даты «YYYY-MM-DD»).
const spanDays = (from, to) => Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1;

const DETAIL_TYPES = ['when', 'where', 'link'];

// Строки с иконками в карточке: «когда», «где» и ссылки. Ссылки — только http(s),
// чтобы из админки нельзя было подсунуть javascript: и подобное.
function toDetails(details) {
  return (details ?? [])
    .filter((detail) => DETAIL_TYPES.includes(detail.type) && detail.text)
    .filter((detail) => detail.type !== 'link' || /^https?:\/\//i.test(detail.url ?? ''))
    .map((detail) => ({ ...detail, text: t(detail.text) }));
}

// Даты, «Важно», детали и контакт пока есть только в моках (src/api/mocks.js):
// бэкенд отдаёт { id, title, body } — тогда объявление показывается без даты и деталей.
// Дату публикации на сайте не показываем, только день события, если он назначен:
// eventDate — день или начало, eventDateEnd — конец, если событие на несколько дней, deadline — срок «до».
function toAnnouncement(raw) {
  const multiDay = Boolean(raw.eventDate && raw.eventDateEnd && raw.eventDateEnd > raw.eventDate);

  return {
    id: raw.id,
    publishedAt: raw.publishedAt ?? null,
    important: Boolean(raw.important),
    title: t(raw.title),
    body: raw.body ? t(raw.body) : null,
    eventDate: toEventDate(raw.eventDate),
    eventEnd: multiDay ? toEventDate(raw.eventDateEnd) : null,
    days: multiDay ? daysLabel(spanDays(raw.eventDate, raw.eventDateEnd)) : null,
    deadline: raw.eventDate ? null : toEventDate(raw.deadline),
    details: toDetails(raw.details),
    contact: raw.contact ? { ...raw.contact, name: raw.contact.name ? t(raw.contact.name) : null } : null,
  };
}

// Новые сверху; без даты публикации — в порядке ответа API.
const byPublished = (a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? '');

// Объявления по дате публикации, новые сверху. Пока загружаются или при ошибке —
// пустой список: блок на главной просто не показывается.
export function useAnnouncements() {
  const { data, loading, error, retry } = useApi('/announcements');

  return useMemo(
    () => ({ items: (data ?? []).map(toAnnouncement).sort(byPublished), loading, error, retry }),
    [data, loading, error, retry],
  );
}
