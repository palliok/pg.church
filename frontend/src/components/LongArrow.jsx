// Длинная стрелка «→» из макета design_handoff_overview: в кнопках «Подробнее», «Все объявления» и строках списков.
export default function LongArrow({ width = 16, stroke = 3 }) {
  return (
    <svg width={width} height={width * 0.375} viewBox="0 0 64 24" aria-hidden="true" style={{ display: 'block', flex: '0 0 auto' }}>
      <path d="M1 12h61M52 1l11 11-11 11" stroke="currentColor" strokeWidth={stroke} fill="none" />
    </svg>
  );
}
