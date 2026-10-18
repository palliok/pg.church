import { useMemo } from 'react';
import { t } from '../i18n.js';
import { useApi } from './useApi.js';

// Действующие объявления для главной: [{ id, title, body }]. Пока загружаются или
// при ошибке — пустой список: блок объявлений просто не показывается.
export function useAnnouncements() {
  const { data } = useApi('/announcements');

  return useMemo(
    () => (data ?? []).map((item) => ({ ...item, title: t(item.title), body: item.body ? t(item.body) : null })),
    [data],
  );
}
