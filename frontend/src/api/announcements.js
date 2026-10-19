import { useMemo } from 'react';
import { getLang, t } from '../i18n.js';
import { dayLabel, formatDate } from './dates.js';
import { useApi } from './useApi.js';

// Короткий месяц на языке сайта: «ИЮН», «JUN». Для киргизского Intl в Chrome
// не знает месяцев — оставляем русское сокращение, как в расписании.
function monthShort(raw) {
  return getLang() === 'en' ? formatDate(raw, 'en', { month: 'short' }).toUpperCase() : raw.mon;
}

// Дата, «когда», «где» и контакт пока есть только в моках (src/api/mocks.js):
// бэкенд отдаёт { id, title, body } — тогда всё объявление считается новым, без даты и деталей.
function toAnnouncement(raw) {
  const hasDate = raw.year != null;

  return {
    id: raw.id,
    isNew: raw.isNew ?? true,
    title: t(raw.title),
    body: raw.body ? t(raw.body) : null,
    day: hasDate ? raw.day : null,
    mon: hasDate ? monthShort(raw) : null,
    dateLabel: hasDate ? dayLabel(raw) : null,
    when: raw.when ? t(raw.when) : null,
    where: raw.where ? t(raw.where) : null,
    contact: raw.contact ? { ...raw.contact, name: raw.contact.name ? t(raw.contact.name) : null } : null,
  };
}

// Объявления: действующие (fresh) и прошедшие (past). Пока загружаются или
// при ошибке — пустые списки, блок на главной просто не показывается.
export function useAnnouncements() {
  const { data, loading, error, retry } = useApi('/announcements');

  return useMemo(() => {
    const all = (data ?? []).map(toAnnouncement);

    return {
      fresh: all.filter((item) => item.isNew),
      past: all.filter((item) => !item.isNew),
      loading,
      error,
      retry,
    };
  }, [data, loading, error, retry]);
}
