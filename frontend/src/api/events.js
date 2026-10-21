import { useMemo } from 'react';
import { getLang, t } from '../i18n.js';
import { dayLabel, formatDate, isoTime } from './dates.js';
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

// Направления расписания (фильтр и цвета на странице расписания). Ключ — значение поля category.
export const EVENT_CATEGORIES = ['Богослужение', 'Таинство', 'Молодёжь', 'Молитва', 'Дети', 'Общение'];

// Подпись направления на языке сайта; «Общение» показываем как «Малые группы».
export const categoryLabel = (category) => t(category === 'Общение' ? 'Малые группы' : category);

const WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

// Поле category пока есть только в моках (src/api/mocks.js). Бэкенд отдаёт лишь свободный тег из админки
// («Воскресенье», «Будни», «Молодёжь»), поэтому направление угадываем по тегу и названию.
const CATEGORY_HINTS = [
  ['Молодёжь', /молод/i],
  ['Дети', /дет/i],
  ['Молитва', /молит/i],
  ['Общение', /групп|общени|обед|чаепити/i],
  ['Таинство', /крещени|причасти|вечеря/i],
  ['Богослужение', /богослуж|воскрес|спевк/i],
];

// Важное событие (main) без подсказки — скорее всего, богослужение; но «Причастие» или «Детский клуб»
// тоже бывают важными, поэтому сначала подсказки.
function eventCategory(raw) {
  if (raw.category) return raw.category;

  const text = `${raw.tag ?? ''} ${raw.title}`;
  return CATEGORY_HINTS.find(([, pattern]) => pattern.test(text))?.[0] ?? (raw.main ? 'Богослужение' : null);
}

// Время события: «11:00 – 13:00», «19:00» без окончания или «Весь день».
function timeRange(raw) {
  if (raw.allDay) return t('Весь день');

  const start = isoTime(raw.startsAt);
  const end = endTime(raw);
  return end ? `${start} – ${end}` : start;
}

// Время окончания, если событие заканчивается в тот же день и не в момент начала.
function endTime(raw) {
  if (raw.allDay || !raw.endsAt || raw.endsAt.slice(0, 10) !== raw.startsAt.slice(0, 10)) return null;

  const end = isoTime(raw.endsAt);
  return end !== isoTime(raw.startsAt) ? end : null;
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
    dowShort: t(WEEKDAYS_SHORT[raw.dow - 1]),
    timeRange: timeRange(raw),
    category: eventCategory(raw),
  };

  if (raw.sermon) event.sermon = toSermon(raw.sermon);
  if (raw.hymns) event.hymns = raw.hymns.map((hymn) => ({ ...hymn, title: t(hymn.title) }));

  return event;
}

// Расписание: без from — начиная с сегодняшнего дня; from и to — даты «2026-10-01».
export function useEvents({ limit, from, to } = {}) {
  const query = new URLSearchParams(Object.entries({ from, to, limit }).filter(([, value]) => value != null)).toString();
  const { data, ...status } = useApi(query ? `/events?${query}` : '/events');
  const events = useMemo(() => (data ?? []).map(toEvent), [data]);

  return { events, ...status };
}

// Событие с проповедью и гимнами; event равен null, пока идёт загрузка или события нет.
export function useEvent(id) {
  const { data, ...status } = useApi(`/events/${encodeURIComponent(id)}`);
  const event = useMemo(() => (data ? toEvent(data) : null), [data]);

  return { event, ...status };
}
