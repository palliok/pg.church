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
