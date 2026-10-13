import { useMemo } from 'react';
import { t } from '../i18n.js';
import { useApi } from './useApi.js';

const lineText = (parts) => parts.map((part) => part.text).join('');

function toSummary(raw) {
  const category = t(raw.category);
  const sub = t(raw.sub);

  return {
    ...raw,
    title: t(raw.title),
    category,
    // «Поклонение · тональность E»: готовый перевод из словаря или сборка из частей.
    sub: sub !== raw.sub ? sub : [category, raw.key ? `${t('тональность')} ${raw.key}` : null].filter(Boolean).join(' · '),
  };
}

// Переводы текстов песен в словаре записаны целыми строфами. Переведённая
// строфа показывается без аккордов: они расставлены по слогам русского текста.
function toSection(section) {
  const text = section.lines.map(lineText).join('\n');
  const translated = t(text);

  return {
    ...section,
    label: t(section.label),
    lines: translated !== text ? translated.split('\n').map((line) => [{ chord: null, text: line }]) : section.lines,
  };
}

function toSong(raw) {
  const sections = raw.sections.map(toSection);

  return {
    ...toSummary(raw),
    sections,
    hasChords: sections.some((section) => section.lines.some((parts) => parts.some((part) => part.chord))),
  };
}

// Весь сборник без текстов, по номерам.
export function useSongs() {
  const { data, ...status } = useApi('/songs');
  const songs = useMemo(() => (data ?? []).map(toSummary), [data]);

  return { songs, ...status };
}

// Поиск по названию, номеру и строке текста; songs равен null, пока ответа нет.
export function useSongSearch(term) {
  const { data } = useApi(term ? `/songs?q=${encodeURIComponent(term)}` : null);

  return useMemo(() => (data ? data.map(toSummary) : null), [data]);
}

// Песня с текстом и аккордами; id === null — ничего не загружать.
export function useSong(id) {
  const { data, ...status } = useApi(id === null ? null : `/songs/${encodeURIComponent(id)}`);
  const song = useMemo(() => (data ? toSong(data) : null), [data]);

  return { song, ...status };
}

export function useSongCategories() {
  const { data } = useApi('/song-categories');

  return useMemo(() => (data ?? []).map((category) => ({ ...category, name: t(category.name) })), [data]);
}
