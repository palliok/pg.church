import { useMemo } from 'react';
import { t } from '../i18n.js';
import { dayLabel, isoDate } from './dates.js';
import { useApi } from './useApi.js';

function toPost(raw) {
  return {
    ...raw,
    title: t(raw.title),
    excerpt: t(raw.excerpt),
    date: dayLabel(isoDate(raw.publishedAt)),
    tags: raw.tags.map((tag) => ({ ...tag, label: t(tag.label) })),
  };
}

// Последние опубликованные записи: type — 'news' или 'blog'.
export function usePosts(type) {
  const { data, ...status } = useApi(`/posts?type=${type}`);
  const posts = useMemo(() => (data ?? []).map(toPost), [data]);

  return { posts, ...status };
}
