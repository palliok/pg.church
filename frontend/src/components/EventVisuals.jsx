import './EventVisuals.css';

// Тег события (макет resources/design_handoff_schedule_2b): контурная пилюля — направление, место.
// Размер задаёт блок, где тег стоит, переменными --tag-h, --tag-px, --tag-fs; цвет обводки — --tag-line.
export function EventTag({ children }) {
  return <span className="ev-tag">{children}</span>;
}

// Тег «Эфир» — у события есть трансляция.
export function LiveTag() {
  return <span className="ev-tag ev-tag--live">Эфир</span>;
}

// Значок места — форма location_on из Material Symbols (FILL 1): шрифт иконок ради одного значка не грузим.
export function PlaceIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ display: 'block', flex: '0 0 auto' }}>
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" fill="currentColor" />
    </svg>
  );
}
