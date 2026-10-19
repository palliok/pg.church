import { useEffect, useState } from 'react';
import { apiGet } from './client.js';
import { t } from '../i18n.js';

// Как часто открытая страница спрашивает, не появилась ли (не пропала ли) ссылка на трансляцию.
const POLL_INTERVAL = 60_000;

// Ссылка на трансляцию: platform — ключ площадки (youtube, vk, rutube… или домен), name — подпись.
function toLink(raw) {
  return { platform: raw.platform, name: t(raw.name), url: raw.url };
}

// signLink — трансляция с переводчиком жестового языка. Пока есть только в моках (src/api/mocks.js):
// бэкенд её не отдаёт, и раздел «С сурдопереводом» в модалке не показывается.
function toLive(raw) {
  return {
    isLive: Boolean(raw.isLive),
    text: raw.text ? t(raw.text) : null,
    links: (raw.links ?? []).map(toLink),
    signLink: raw.signLink ? toLink(raw.signLink) : null,
  };
}

// Идёт ли сейчас трансляция: { isLive, text, links: [{ platform, name, url }], signLink } или null, пока ответа нет.
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
      apiGet('/live', { signal: controller.signal }).then((raw) => setLive(toLive(raw))).catch(() => {});
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
