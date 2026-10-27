import { t } from '../i18n.js';
import { ImportantPill } from './AnnouncementCards.jsx';
import { PhoneIcon, PlaceIcon, ShareIcon } from './Icons.jsx';
import LongArrow from './LongArrow.jsx';

// Дата одной пилюлей: «До 5 ноября», «1 ноября» или «14 ноя → 20 ноя».
function dateText(item) {
  if (item.deadline) return `${t('До')} ${item.deadline.full}`;
  if (item.eventEnd) return `${item.eventDate.day} ${item.eventDate.mon} → ${item.eventEnd.day} ${item.eventEnd.mon}`;

  return item.eventDate?.full ?? null;
}

// Дата на плакате: число и месяц в одну строку, день недели — под месяцем. У срока ещё подпись «до» над числом.
function PlacardDate({ date, label, before }) {
  return (
    <span className="ann8-date">
      {before && <span className="ann8-date-label ann8-date-before">{before}</span>}
      <span className="ann8-date-day">
        <span className="ann8-date-num">{date.day}</span>
        <span className="ann8-date-side">
          <span className="ann8-date-mon">{date.mon}</span>
          {label && <span className="ann8-date-label">{label}</span>}
        </span>
      </span>
    </span>
  );
}

// Даты плаката одной строкой: срок «до», один день или «16 → 22»; рядом пилюли длительности
// и уточнения времени («С 10:00»), как в сторис.
function PlacardDates({ item, when }) {
  if (!item.deadline && !item.eventDate && !when) return null;

  return (
    <div className={`ann8-dates ${item.eventEnd ? 'is-range' : ''}`}>
      {item.deadline && <PlacardDate date={item.deadline} before={t('До')} label={item.deadline.weekday} />}
      {item.eventDate && <PlacardDate date={item.eventDate} label={item.eventDate.weekday} />}
      {item.eventEnd && (
        <>
          <span className="ann8-dates-arrow"><LongArrow width={32} stroke={2} /></span>
          <PlacardDate date={item.eventEnd} label={item.eventEnd.weekday} />
        </>
      )}
      {(item.days || when) && (
        <span className="ann8-dates-pills">
          {item.days && <span className="ann8-pill">{item.days}</span>}
          {when && <span className="ann8-pill">{when.text}</span>}
        </span>
      )}
    </div>
  );
}

// Плашка списка на десктопе (макет design_handoff_announcements_8a): заголовок и «Важно» сверху,
// под ними белые пилюли с датой и временем. active — открытая в плакате справа.
export function AnnouncementPlate({ item, read = false, active = false, onOpen }) {
  const date = dateText(item);
  const when = item.details.find((detail) => detail.type === 'when');

  return (
    <button
      type="button"
      className={`ann8-plate ${read ? 'is-read' : ''} ${active ? 'is-active' : ''}`}
      aria-current={active ? 'true' : undefined}
      onClick={onOpen}
    >
      <span className="ann8-plate-head">
        <span className="ann8-plate-title">{item.title}</span>
        {item.important && <ImportantPill />}
      </span>
      {(date || when) && (
        <span className="ann8-plate-pills">
          {date && <span className="ann8-pill">{date}</span>}
          {when && <span className="ann8-pill">{when.text}</span>}
        </span>
      )}
    </button>
  );
}

// Открытое объявление — светлый плакат, порядок как в сторис: «Важно», заголовок и текст, крупная дата со временем,
// под ней место и ссылки; внизу основное действие (звонок или ссылка с primary) и справа в углу «Поделиться».
export function AnnouncementPlacard({ item, onShare }) {
  const when = item.details.find((detail) => detail.type === 'when');
  const where = item.details.find((detail) => detail.type === 'where');
  const links = item.details.filter((detail) => detail.type === 'link');
  // Основное действие — крупной тёмной кнопкой внизу: ссылка с primary, иначе звонок.
  // Если основная — ссылка, телефон становится обычной прозрачной плашкой.
  const main = links.find((link) => link.primary);
  const other = links.filter((link) => link !== main);
  const phoneText = item.contact && (item.contact.name ? `${item.contact.phone} · ${item.contact.name}` : item.contact.phone);

  return (
    <article className="ann8-poster">
      <div className="ann8-poster-marks">{item.important && <ImportantPill />}</div>

      <div className="ann8-poster-text">
        <h2 className="ann8-poster-title">{item.title}</h2>
        {item.body && <p className="ann8-poster-body">{item.body}</p>}
      </div>

      <PlacardDates item={item} when={when} />

      {(where || other.length > 0 || (main && item.contact)) && (
        <div className="ann8-poster-info">
          {where && (
            <span className="ann8-poster-place">
              <PlaceIcon size={20} />
              <span>{where.text}</span>
            </span>
          )}
          {(other.length > 0 || (main && item.contact)) && (
            <div className="ann8-poster-links">
              {other.map((link) => (
                <a key={link.url + link.text} className="ann8-poster-link" href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.text}
                  <LongArrow />
                </a>
              ))}
              {main && item.contact && (
                <a className="ann8-poster-link" href={item.contact.tel}>
                  <PhoneIcon size={14} />
                  {phoneText}
                </a>
              )}
            </div>
          )}
        </div>
      )}

      <div className="ann8-poster-foot">
        {main && (
          <a className="ann8-poster-call" href={main.url} target="_blank" rel="noopener noreferrer">
            <span>{main.text}</span>
            <LongArrow />
          </a>
        )}
        {!main && item.contact && (
          <a className="ann8-poster-call" href={item.contact.tel}>
            <PhoneIcon />
            <span>{phoneText}</span>
          </a>
        )}
        <button type="button" className="ann8-poster-share" aria-label={t('Поделиться')} onClick={() => onShare(item)}>
          <ShareIcon size={18} />
        </button>
      </div>
    </article>
  );
}
