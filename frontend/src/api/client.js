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

// Ответы API имеют вид { data: ... } — возвращаем содержимое data.
export async function apiGet(path, { signal } = {}) {
  const response = await fetch(BASE_URL + path, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) throw new ApiError(response.status);
  return (await response.json()).data;
}
