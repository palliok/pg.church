import { useEffect, useState } from 'react';

// «Не гасить экран» (Screen Wake Lock API). Браузер снимает блокировку, когда вкладка скрыта,
// поэтому при возвращении на неё она запрашивается заново. supported — есть ли API в браузере.
export default function useWakeLock() {
  const [on, setOn] = useState(false);
  const supported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

  useEffect(() => {
    if (!on || !supported) return undefined;

    let lock = null;
    let cancelled = false;

    const request = async () => {
      try {
        const next = await navigator.wakeLock.request('screen');
        if (cancelled) next.release();
        else lock = next;
      } catch {
        // Отказ браузера (энергосбережение, вкладка не активна) — экран погаснет как обычно.
      }
    };
    const onVisible = () => document.visibilityState === 'visible' && request();

    request();
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      lock?.release().catch(() => {});
    };
  }, [on, supported]);

  return { on, setOn, supported };
}
