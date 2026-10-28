import { useState } from 'react';

const READ_KEY = 'announcements:read';

// Прочитанные объявления (id), которые посетитель уже раскрывал.
function loadRead() {
  try {
    const ids = JSON.parse(localStorage.getItem(READ_KEY) ?? '[]');
    return Array.isArray(ids) ? ids.map(String) : [];
  } catch {
    return [];
  }
}

function saveRead(ids) {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify(ids));
  } catch {
    // Приватный режим или переполнение: отметки не сохранятся, страница работает.
  }
}

// Прочитанные объявления: readIds и markRead(...ids). Страница отмечает объявление, как только его показали в сторис.
export default function useReadAnnouncements() {
  const [readIds, setReadIds] = useState(loadRead);

  const markRead = (...ids) => {
    const fresh = ids.filter((id) => id && !readIds.includes(id));
    if (!fresh.length) return;
    const next = [...readIds, ...fresh];
    setReadIds(next);
    saveRead(next);
  };

  return { readIds, markRead };
}
