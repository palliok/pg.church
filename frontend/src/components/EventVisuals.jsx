import './EventVisuals.css';

// Водяной знак в углу карточки: иконка события, а без иконки — число дня (оно чуть мельче иконки).
// Размер и положение задаёт карточка переменными --mark-size, --mark-right, --mark-top.
// Родитель — position: relative; overflow: hidden, содержимое поверх — position: relative.
export function EventWatermark({ event }) {
  if (event.icon) return <span className="material-symbols-rounded ev-mark ev-mark--icon" aria-hidden="true">{event.icon}</span>;

  return <span className="ev-mark ev-mark--day" aria-hidden="true">{event.day}</span>;
}

// Плашка «Сегодня», «Богослужение»: по умолчанию контрастная к фону карточки, tone — 'ink' или 'white'.
export function EventChip({ tone, children }) {
  return <span className={`ev-chip${tone ? ` ev-chip--${tone}` : ''}`}>{children}</span>;
}

// Бейдж «Эфир» — у события есть трансляция.
export function LiveBadge() {
  return (
    <span className="ev-live">
      <LiveDot />
      Эфир
    </span>
  );
}

// Красная точка рядом с названием события с трансляцией.
export function LiveDot() {
  return <span className="ev-live-dot" aria-hidden="true" />;
}
