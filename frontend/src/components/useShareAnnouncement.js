import { useEffect, useRef, useState } from 'react';
import { t } from '../i18n.js';

// «Поделиться» объявлением: системное меню, а где его нет — ссылка ?a=<id> в буфер обмена.
// toast — подпись для всплывашки, пустая строка — скрыта.
export default function useShareAnnouncement() {
  const [toast, setToast] = useState('');
  const toastTimer = useRef(null);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  const showToast = (text) => {
    clearTimeout(toastTimer.current);
    setToast(text);
    toastTimer.current = setTimeout(() => setToast(''), 2000);
  };

  const share = async (item) => {
    const url = new URL(window.location.href);
    url.search = `?a=${item.id}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, url: url.toString() });
        return;
      }
      await navigator.clipboard.writeText(url.toString());
      showToast(t('Ссылка скопирована'));
    } catch (shareError) {
      // Пользователь закрыл меню «Поделиться» — это не ошибка.
      if (shareError?.name !== 'AbortError') showToast(t('Не удалось скопировать ссылку'));
    }
  };

  return { share, toast };
}
