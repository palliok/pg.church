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
