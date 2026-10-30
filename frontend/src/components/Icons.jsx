// Значки из Material Symbols (макет design_handoff_overview) встроенным SVG: шрифт иконок ради нескольких значков не грузим.

const svgProps = (size) => ({ width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true, style: { display: 'block', flex: '0 0 auto' } });

// Место — location_on.
export function PlaceIcon({ size = 14 }) {
  return (
    <svg {...svgProps(size)}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" fill="currentColor" />
    </svg>
  );
}

// Телефон — call.
export function PhoneIcon({ size = 16 }) {
  return (
    <svg {...svgProps(size)}>
      <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.98.98 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" fill="currentColor" />
    </svg>
  );
}

// «Поделиться» — ios_share.
export function ShareIcon({ size = 22 }) {
  return (
    <svg {...svgProps(size)}>
      <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z" fill="currentColor" />
    </svg>
  );
}

// Плитка объявления — play_circle.
export function PlayCircleIcon({ size = 24 }) {
  return (
    <svg {...svgProps(size)}>
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z" fill="currentColor" />
    </svg>
  );
}

// Пауза — pause.
export function PauseIcon({ size = 24 }) {
  return (
    <svg {...svgProps(size)}>
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="currentColor" />
    </svg>
  );
}

// Продолжить — play_arrow.
export function PlayIcon({ size = 24 }) {
  return (
    <svg {...svgProps(size)}>
      <path d="M8 5v14l11-7z" fill="currentColor" />
    </svg>
  );
}

// Закрыть — close.
export function CloseIcon({ size = 24 }) {
  return (
    <svg {...svgProps(size)}>
      <path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" fill="currentColor" />
    </svg>
  );
}

// Объявление без даты — campaign.
export function CampaignIcon({ size = 24 }) {
  return (
    <svg {...svgProps(size)}>
      <path d="M18 11v2h4v-2h-4zm-2 6.61c.96.71 2.21 1.65 3.2 2.39.4-.53.8-1.07 1.2-1.6-.99-.74-2.24-1.68-3.2-2.4-.4.54-.8 1.08-1.2 1.61zM20.4 5.6c-.4-.53-.8-1.07-1.2-1.6-.99.74-2.24 1.68-3.2 2.4.4.53.8 1.07 1.2 1.6.96-.72 2.21-1.65 3.2-2.4zM4 9c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1v4h2v-4h1l5 3V6L8 9H4zm11.5 3c0-1.33-.58-2.53-1.5-3.35v6.69c.92-.81 1.5-2.01 1.5-3.34z" fill="currentColor" />
    </svg>
  );
}

// Событие в расписании — event.
export function EventIcon({ size = 24 }) {
  return (
    <svg {...svgProps(size)}>
      <path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19a2 2 0 0 0 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z" fill="currentColor" />
    </svg>
  );
}

// Время — schedule.
export function ScheduleIcon({ size = 24 }) {
  return (
    <svg {...svgProps(size)}>
      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" fill="currentColor" />
    </svg>
  );
}

// Прочитано — done_all.
export function DoneAllIcon({ size = 24 }) {
  return (
    <svg {...svgProps(size)}>
      <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z" fill="currentColor" />
    </svg>
  );
}

// Поиск — search.
export function SearchIcon({ size = 24 }) {
  return (
    <svg {...svgProps(size)}>
      <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor" />
    </svg>
  );
}

// Текст мельче — text_decrease.
export function TextDecreaseIcon({ size = 24 }) {
  return (
    <svg {...svgProps(size)}>
      <path d="M.99 19h2.42l1.27-3.58h5.65L11.59 19h2.42L8.75 5h-2.5L.99 19zm4.42-5.61L7.44 7.6h.12l2.03 5.79H5.41zM23 11v2h-8v-2h8z" fill="currentColor" />
    </svg>
  );
}

// Текст крупнее — text_increase.
export function TextIncreaseIcon({ size = 24 }) {
  return (
    <svg {...svgProps(size)}>
      <path d="M.99 19h2.42l1.27-3.58h5.65L11.59 19h2.42L8.75 5h-2.5L.99 19zm4.42-5.61L7.44 7.6h.12l2.03 5.79H5.41zM20 11h3v2h-3v3h-2v-3h-3v-2h3V8h2v3z" fill="currentColor" />
    </svg>
  );
}

// Настройки — settings.
export function SettingsIcon({ size = 24 }) {
  return (
    <svg {...svgProps(size)}>
      <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z" fill="currentColor" />
    </svg>
  );
}

// Светлая тема — light_mode.
export function LightModeIcon({ size = 24 }) {
  return (
    <svg {...svgProps(size)}>
      <circle cx="12" cy="12" r="4.5" fill="currentColor" />
      <path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3M4.58 4.58l2.12 2.12M17.3 17.3l2.12 2.12M4.58 19.42l2.12-2.12M17.3 6.7l2.12-2.12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Тёмная тема — dark_mode.
export function DarkModeIcon({ size = 24 }) {
  return (
    <svg {...svgProps(size)}>
      <path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.39 5.39 0 0 1-4.4 2.26 5.4 5.4 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z" fill="currentColor" />
    </svg>
  );
}
