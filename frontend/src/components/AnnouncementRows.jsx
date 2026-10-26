import { ImportantPill } from './AnnouncementCards.jsx';
import LongArrow from './LongArrow.jsx';

// День на плашке — только у события в один день. У срока «до», события на несколько дней
// и регулярных объявлений плашки нет: их даты видны в карточке справа.
const plateDate = (item) => (item.eventEnd ? null : item.eventDate);

// Плашка с числом и месяцем слева от заголовка.
function DatePlate({ date }) {
  return (
    <span className="ann12-plate">
      <span className="ann12-plate-day">{date.day}</span>
      <span className="ann12-plate-mon">{date.mon}</span>
    </span>
  );
}

// Строка списка на десктопе: плашка с числом слева, «Важно» под заголовком. active — выбранная строка.
export function AnnouncementRow({ item, read = false, active = false, onOpen }) {
  const date = plateDate(item);

  return (
    <div className="ann12-row">
      <button
        type="button"
        className={`ann12-row-btn ${read ? 'is-read' : ''} ${active ? 'is-active' : ''}`}
        aria-current={active ? 'true' : undefined}
        onClick={onOpen}
      >
        {date && <DatePlate date={date} />}
        <span className="ann12-row-text">
          {item.important && (
            <span className="ann12-row-meta">
              <ImportantPill />
            </span>
          )}
          <span className="ann12-row-title">{item.title}</span>
        </span>
        <span className="ann12-row-arrow"><LongArrow width={28} stroke={2.6} /></span>
      </button>
    </div>
  );
}
