import { useCallback, useEffect, useState } from 'react';
import { apiGet } from './client.js';

// Загружает данные по адресу API и перезагружает их при смене адреса.
// notFound — бэкенд ответил 404; error — любая другая ошибка (сеть, 5xx).
// path === null — запрос не нужен (например, пустая строка поиска).
export function useApi(path) {
  const [result, setResult] = useState({ key: null, data: null, error: null });
  const [attempt, setAttempt] = useState(0);
  const key = `${path}#${attempt}`;

  useEffect(() => {
    if (path === null) return undefined;

    const controller = new AbortController();
    apiGet(path, { signal: controller.signal })
      .then((data) => setResult({ key, data, error: null }))
      .catch((error) => {
        if (error.name !== 'AbortError') setResult({ key, data: null, error });
      });
    return () => controller.abort();
  }, [path, key]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  // Ответ на предыдущий адрес не показываем: для нового адреса это ещё загрузка.
  const current = path !== null && result.key === key ? result : { data: null, error: null };
  const notFound = current.error?.status === 404;

  return {
    data: current.data,
    loading: path !== null && current.data === null && current.error === null,
    notFound,
    error: notFound ? null : current.error,
    retry,
  };
}
