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

