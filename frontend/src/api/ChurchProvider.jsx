import { useEffect, useMemo, useState } from 'react';
import { t } from '../i18n.js';
import { ChurchContext } from './church.js';
import { useApi } from './useApi.js';

// Последний ответ API хранится в браузере: шапка и контакты есть на каждой
// странице, и при повторном заходе они показываются сразу, не дожидаясь сети.
const CACHE_KEY = 'church:v1';

function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY));
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Хранилище недоступно (приватный режим, переполнение) — работаем без кэша.
  }
}

function toChurch(raw) {
  return {
    ...raw,
    name: t(raw.name),
    city: t(raw.city),
    address: t(raw.address),
    metro: t(raw.metro),
    duty: {
      ...raw.duty,
      shifts: raw.duty.shifts.map((shift) => ({ ...shift, dow: t(shift.dow), name: t(shift.name) })),
    },
  };
}

// Загружает данные церкви один раз на всё приложение и раздаёт их через useChurch().
export default function ChurchProvider({ children }) {
  const { data } = useApi('/church');
  const [cached] = useState(readCache);

  useEffect(() => {
    if (data) writeCache(data);
  }, [data]);

  const church = useMemo(() => {
    const raw = data ?? cached;
    return raw ? toChurch(raw) : null;
  }, [data, cached]);

  return <ChurchContext value={church}>{children}</ChurchContext>;
}
