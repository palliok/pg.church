import { useMemo } from 'react';
import { getLang, t } from '../i18n.js';
import { dayLabel, formatDate } from './dates.js';
import { useApi } from './useApi.js';

function toSermon(sermon) {
  return {
    ...sermon,
    initial: t(sermon.initial),
    name: t(sermon.name),
    role: t(sermon.role),
    topic: t(sermon.topic),
    ref: t(sermon.ref),
    intro: t(sermon.intro),
    verse: t(sermon.verse),
    verseRef: t(sermon.verseRef),
    outline: sermon.outline.map((point) => ({ ...point, text: t(point.text) })),
    durationLabel: sermon.durationMinutes ? `${t('Слушать')} ${sermon.durationMinutes} ${t('мин')}` : null,
  };
}

// Месяц и день недели на языке сайта. Русские отдаёт API, английские строит Intl,
// а для киргизского в Chrome нет данных Intl — берём переводы из словаря.
function dateLabels(raw) {
  switch (getLang()) {
    case 'en':
      return {
        mon: formatDate(raw, 'en', { month: 'short' }).toUpperCase(),
        dowLabel: formatDate(raw, 'en', { weekday: 'long' }),
      };
    case 'ky':
      return { mon: raw.mon, dowLabel: t(raw.dowLabel) };
    default:
      return { mon: raw.mon, dowLabel: raw.dowLabel };
  }
}

// Приводит событие из API к виду, который ждут страницы: тексты переводятся
// словарём, как раньше моки, подписи даты — на языке сайта.
function toEvent(raw) {
  const labels = dateLabels(raw);
  const place = t(raw.place);
  const event = {
    ...raw,
    ...labels,
    dateLabel: dayLabel(raw),
    title: t(raw.title),
    tag: t(raw.tag),
    place,
    addr: t(raw.addr),
    desc: raw.desc.map(t),
    when: [labels.dowLabel, raw.timeLabel, place].filter(Boolean).join(' · '),
  };

  if (raw.sermon) event.sermon = toSermon(raw.sermon);
  if (raw.hymns) event.hymns = raw.hymns.map((hymn) => ({ ...hymn, title: t(hymn.title) }));

  return event;
}

// Расписание начиная с сегодняшнего дня.
export function useEvents({ limit } = {}) {
  const { data, ...status } = useApi(limit ? `/events?limit=${limit}` : '/events');
  const events = useMemo(() => (data ?? []).map(toEvent), [data]);

  return { events, ...status };
}

// Событие с проповедью и гимнами; event равен null, пока идёт загрузка или события нет.
export function useEvent(id) {
  const { data, ...status } = useApi(`/events/${encodeURIComponent(id)}`);
  const event = useMemo(() => (data ? toEvent(data) : null), [data]);

  return { event, ...status };
}
