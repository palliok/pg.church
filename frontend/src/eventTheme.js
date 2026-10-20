// Цвета направлений из макета расписания (resources/design_handoff_schedule): фон карточки
// и квадрата времени, текст и второстепенный текст на нём. dark — тёмный фон.
const BLUE = { bg: '#02407d', fg: '#fff', sub: 'rgba(255, 255, 255, 0.72)', dark: true };
const PEACH = { bg: '#f9c9a5', fg: '#0d0d0d', sub: '#5c4636', dark: false };
const THEMES = {
  'Богослужение': BLUE,
  'Таинство': BLUE,
  'Молодёжь': PEACH,
  'Дети': PEACH,
  'Молитва': { bg: '#0d0d0d', fg: '#fff', sub: 'rgba(255, 255, 255, 0.72)', dark: true },
  'Общение': { bg: '#00b7e3', fg: '#0d0d0d', sub: 'rgba(13, 13, 13, 0.72)', dark: false },
};
// Направление не указано и не угадалось.
const NEUTRAL = { bg: '#dcdcdf', fg: '#0d0d0d', sub: 'var(--c-gray-text)', dark: false };

export function eventTheme(event) {
  return THEMES[event.category] ?? NEUTRAL;
}

// Тема события CSS-переменными для style: --ev-bg, --ev-fg, --ev-sub и контрастные к фону
// --ev-btn-bg / --ev-btn-fg — на тёмном фоне чипы и кнопки белые, на светлом чёрные; --ev-line — обводка кнопок.
export function themeVars(event) {
  const theme = eventTheme(event);

  return {
    '--ev-bg': theme.bg,
    '--ev-fg': theme.fg,
    '--ev-sub': theme.sub,
    '--ev-btn-bg': theme.dark ? '#fff' : 'var(--c-ink)',
    '--ev-btn-fg': theme.dark ? 'var(--c-ink)' : '#fff',
    '--ev-line': theme.dark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(13, 13, 13, 0.25)',
  };
}
