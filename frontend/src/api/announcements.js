import { useMemo } from 'react';
import { getLang, t } from '../i18n.js';
import { dayLabel, formatDate } from './dates.js';
import { useApi } from './useApi.js';

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];

// Месяц для вкладки под числом: «июня», «June». Для киргизского Intl в Chrome
// не знает месяцев — берём из словаря.
function monthLabel(raw) {
  const lang = getLang();
  if (lang === 'ky') return t(MONTHS[raw.month - 1]).toLowerCase();

  return formatDate(raw, lang, { day: 'numeric', month: 'long' }).replace(/\d+/, '').trim();
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

// Дата, «Важно», детали и контакт пока есть только в моках (src/api/mocks.js):
// бэкенд отдаёт { id, title, body } — тогда объявление показывается без даты и деталей.
function toAnnouncement(raw) {
  const hasDate = raw.year != null;

  return {
    id: raw.id,
    important: Boolean(raw.important),
    title: t(raw.title),
    body: raw.body ? t(raw.body) : null,
    day: hasDate ? raw.day : null,
    month: hasDate ? monthLabel(raw) : null,
    dateLabel: hasDate ? dayLabel(raw) : null,
    details: toDetails(raw.details),
    contact: raw.contact ? { ...raw.contact, name: raw.contact.name ? t(raw.contact.name) : null } : null,
  };
}

// Объявления по дате, новые сверху. Пока загружаются или при ошибке —
// пустой список: блок на главной просто не показывается.
export function useAnnouncements() {
  const { data, loading, error, retry } = useApi('/announcements');

  return useMemo(() => ({ items: (data ?? []).map(toAnnouncement), loading, error, retry }), [data, loading, error, retry]);
}
