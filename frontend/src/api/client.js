// Клиент публичного API бэкенда (Laravel, см. backend/README.md).
// По умолчанию запросы идут на тот же домен; в разработке /api проксирует Vite.
const BASE_URL = (import.meta.env.VITE_API_URL ?? '/api/v1').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(status) {
    super(`API responded with ${status}`);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Режим mock (`npm run dev:mock`, `build:mock`): данные берутся из src/api/mocks.js, бэкенд не нужен.
// Условие известно при сборке, поэтому в обычную сборку модуль с моками не попадает.
const USE_MOCKS = import.meta.env.MODE === 'mock';

// Ответы API имеют вид { data: ... } — возвращаем содержимое data.
export async function apiGet(path, { signal } = {}) {
  if (USE_MOCKS) {
    const { mockGet } = await import('./mocks.js');
    const { status, data } = await mockGet(path);
    signal?.throwIfAborted();
    if (status !== 200) throw new ApiError(status);
    return data;
  }

  const response = await fetch(BASE_URL + path, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new ApiError(response.status);
  return (await response.json()).data;
}
