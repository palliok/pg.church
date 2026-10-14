import { useEffect, useState } from 'react';
import { apiGet } from './client.js';

// Как часто открытая страница спрашивает, не появилась ли (не пропала ли) ссылка на трансляцию.
const POLL_INTERVAL = 60_000;

// Идёт ли сейчас трансляция: { isLive, links: [{ platform, name, url }], text } или null, пока ответа нет.
// Обновляется раз в минуту и при возвращении на вкладку.
export function useLive() {
  const [live, setLive] = useState(null);

  useEffect(() => {
    let controller = null;

    const load = () => {
      if (document.hidden) return;

      controller?.abort();
      controller = new AbortController();
      // При ошибке сети оставляем прошлый ответ: плашка не должна мигать.
      apiGet('/live', { signal: controller.signal }).then(setLive).catch(() => {});
    };

    load();
    const timer = setInterval(load, POLL_INTERVAL);
    document.addEventListener('visibilitychange', load);

    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', load);
      controller?.abort();
    };
  }, []);

  return live;
}
