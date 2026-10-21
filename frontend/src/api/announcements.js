import { useMemo } from 'react';
import { getLang, t } from '../i18n.js';
import { dayLabel, formatDate, isoDate, monthLabel } from './dates.js';
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

// Конкретный день события { day, month, label } или null, если объявление без даты.
function toEventDate(value) {
  if (!value) return null;
  const date = isoDate(value);

  return { day: date.day, month: monthLabel(date), label: eventLabel(date) };
}

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
// Дату публикации на сайте не показываем, только день события, если он назначен.
function toAnnouncement(raw) {
  return {
    id: raw.id,
    publishedAt: raw.publishedAt ?? null,
    important: Boolean(raw.important),
    title: t(raw.title),
    body: raw.body ? t(raw.body) : null,
    eventDate: toEventDate(raw.eventDate),
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
