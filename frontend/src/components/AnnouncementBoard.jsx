import { useEffect, useState } from 'react';
import { t } from '../i18n.js';
import { ownPlace } from '../api/announcements.js';
import { ImportantPill, LinkedEvent, Megaphone } from './AnnouncementCards.jsx';
import { CampaignIcon, DoneAllIcon, EventIcon, PhoneIcon, PlaceIcon, ScheduleIcon, ShareIcon } from './Icons.jsx';
import LongArrow from './LongArrow.jsx';
import './AnnouncementBoard.css';


// Как показывать дату: связанное событие важнее собственных дат объявления.
function dateKind(item) {
  if (item.event) return 'event';
  if (item.eventEnd) return 'range';
  if (item.eventDate) return 'date';
  if (item.deadline) return 'until';
  if (item.regular) return 'regular';

  return 'none';
}

const detail = (item, type) => item.details.find((entry) => entry.type === type);

// Плитка даты в строке списка: число и месяц без дня недели — «15–21 / нояб», «До / 4 / нояб»; у регулярного — «Кажд. / Пт / 19:00».
// Первая строка — подпись сверху, null — без неё.
function tileLines(item, kind) {
  switch (kind) {
    case 'event':
      return [null, item.event.day, item.event.mon];
    case 'range': {
      const { eventDate: from, eventEnd: to } = item;
      return [null, `${from.day}–${to.day}`, from.mon === to.mon ? from.mon : `${from.mon}–${to.mon}`];
    }
    case 'date':
      return [null, item.eventDate.day, item.eventDate.mon];
    case 'until':
      return [t('До'), item.deadline.day, item.deadline.mon];
    case 'regular':
      return [t('Кажд.'), item.regular.dow, item.regular.time];
    default:
      return null;
  }
}

// Время в строке списка: у события — его время, у нескольких дней — длительность, у регулярного — день недели.
function rowTime(item, kind) {
  switch (kind) {
    case 'event':
      return item.event.timeRange;
    case 'range':
      return item.days;
    case 'regular':
      return item.regular.weekday;
    default:
      return detail(item, 'when')?.text ?? null;
  }
}

const placeOf = (item) => (item.event ? item.event.place : detail(item, 'where')?.text) || null;

// Строка списка (макет design_handoff_announcements 2, вариант 7a): плитка даты с голубой точкой непрочитанного,
// «Важно» и метка «В расписании», заголовок, время и место. active — открыто в сторис.
function AnnouncementRow({ item, active, read, unread, onOpen }) {
  const kind = dateKind(item);
  const lines = tileLines(item, kind);
  const time = rowTime(item, kind);
  const place = placeOf(item);

  return (
    <button
      type="button"
      className={`ann7-row ${active ? 'is-active' : ''} ${read ? 'is-read' : ''}`}
      aria-current={active ? 'true' : undefined}
      onClick={onOpen}
    >
      <span className="ann7-tile">
        {lines ? (
          <>
            {lines[0] && <span className="ann7-tile-label">{lines[0]}</span>}
            <span className="ann7-tile-big">{lines[1]}</span>
            <span className="ann7-tile-bottom">{lines[2]}</span>
          </>
        ) : (
          <CampaignIcon size={26} />
        )}
        {unread && <span className="ann7-tile-dot" />}
      </span>

      <span className="ann7-row-text">
        {(item.important || item.event) && (
          <span className="ann7-row-chips">
            {item.important && <ImportantPill />}
            {item.event && (
              <span className="ann7-row-event">
                <EventIcon size={13} />
                <span>В расписании</span>
              </span>
            )}
          </span>
        )}
        <span className="ann7-row-title">{item.title}</span>
        {(time || place) && (
          <span className="ann7-row-meta">
            {time && (
              <span>
                <ScheduleIcon size={14} />
                {time}
              </span>
            )}
            {place && (
              <span>
                <PlaceIcon size={14} />
                {place}
              </span>
            )}
          </span>
        )}
      </span>

      {read ? <span className="ann7-row-done"><DoneAllIcon size={18} /></span> : <LongArrow width={28} stroke={2.6} />}
    </button>
  );
}

// Число с месяцем справа от него: «15 нояб»; у срока перед числом — «До».
function BigDate({ date, until = false }) {
  return (
    <span className="ann7-big-date">
      {until && <span className="ann7-big-until">До</span>}
      <span className="ann7-big-num">{date.day}</span>
      <span className="ann7-big-mon">{date.mon}</span>
    </span>
  );
}

// Правая часть сторис: карточка связанного события или крупная дата по типу объявления.
function StoryWhen({ item }) {
  const kind = dateKind(item);
  const when = detail(item, 'when')?.text;

  // У связанного события — его карточка; уточнение под ней, как под датой.
  if (kind === 'event') {
    return (
      <div className="ann7-when">
        <LinkedEvent event={item.event} />
        {when && <span className="ann7-pill">{when}</span>}
      </div>
    );
  }

  if (kind === 'range') {
    return (
      <div className="ann7-when">
        <div className="ann7-range">
          <BigDate date={item.eventDate} />
          <span className="ann7-range-arrow"><LongArrow width={28} stroke={2.6} /></span>
          <BigDate date={item.eventEnd} />
        </div>
        <span className="ann7-pill">{item.days}</span>
      </div>
    );
  }

  if (kind === 'date' || kind === 'until') {
    const date = kind === 'date' ? item.eventDate : item.deadline;
    return (
      <div className="ann7-when">
        <BigDate date={date} until={kind === 'until'} />
        {when && <span className="ann7-pill">{when}</span>}
      </div>
    );
  }

  if (kind === 'regular') {
    return (
      <div className="ann7-when">
        <span className="ann7-when-note">Каждую неделю</span>
        <span className="ann7-when-time">{item.regular.time}</span>
        <span className="ann7-when-weekday">{item.regular.weekday}</span>
      </div>
    );
  }

  return null;
}

// Карточка объявления: «Важно» и «Поделиться», заголовок, текст, место, ссылки и контакт слева,
// дата или связанное событие справа. Основное действие — основная ссылка или звонок — белой плашкой последним,
// остальные ссылки и неосновной телефон — пилюлями с обводкой.
function StoryCard({ item, onPrev, onNext, onShare }) {
  const where = item.event ? ownPlace(item) : placeOf(item);
  const links = item.details.filter((entry) => entry.type === 'link');
  const main = links.find((link) => link.primary);
  const other = links.filter((link) => link !== main);
  const call = item.contact?.primary && !main ? item.contact : null;
  const contact = item.contact && !call ? item.contact : null;

  return (
    <div className="ann7-story">
      <Megaphone className="ann7-megaphone" />

      <div className="ann7-story-top">
        {item.important && <ImportantPill />}
        <button type="button" className="ann7-share" aria-label={t('Поделиться')} onClick={() => onShare(item)}>
          <ShareIcon size={19} />
        </button>
      </div>

      {/* Невидимые зоны нажатия: левее — предыдущее, правее — следующее */}
      <button type="button" className="ann7-tap is-prev" aria-label="Предыдущее объявление" onClick={onPrev} />
      <button type="button" className="ann7-tap is-next" aria-label="Следующее объявление" onClick={onNext} />

      {/* Заголовок — на всю ширину карточки, над текстом и датой или событием справа */}
      <div key={item.id} className="ann7-story-main" aria-live="polite">
        <h2 className="ann7-story-title">{item.title}</h2>
        <div className="ann7-story-text">
          {item.body && <p className="ann7-story-body">{item.body}</p>}
          {where && (
            <span className="ann7-story-place">
              <PlaceIcon size={16} />
              {where}
            </span>
          )}
          {(other.length > 0 || contact) && (
            <div className="ann7-story-links">
              {other.map((link) => (
                <a key={link.url + link.text} className="ann7-story-link" href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.text}
                  <span aria-hidden="true">↗</span>
                </a>
              ))}
              {contact && (
                <a className="ann7-story-link" href={contact.tel}>
                  <PhoneIcon size={14} />
                  {contact.name ? `${contact.phone} · ${contact.name}` : contact.phone}
                </a>
              )}
            </div>
          )}
          {main && (
            <a className="ann7-contact" href={main.url} target="_blank" rel="noopener noreferrer">
              <span className="ann7-contact-text">{main.text}</span>
              <span className="ann7-contact-call"><LongArrow /></span>
            </a>
          )}
          {call && (
            <a className="ann7-contact" href={call.tel}>
              {/* Номер и имя одной строкой: «+7 921 000-12-34 · Анна» */}
              <span className="ann7-contact-text">{call.name ? `${call.phone} · ${call.name}` : call.phone}</span>
              <span className="ann7-contact-call"><PhoneIcon size={20} /></span>
            </a>
          )}
        </div>
        <div className="ann7-story-side">
          <StoryWhen item={item} />
        </div>
      </div>
    </div>
  );
}

// Десктоп страницы объявлений (макет design_handoff_announcements 2, вариант 7a): слева карточка открытого
// объявления со стопкой подложек, справа список всех по дате публикации. Сами объявления не переключаются:
// открывает строка списка, нажатие слева или справа на карточке листает список по кругу.
// Показанное в карточке сразу становится прочитанным.
// initialId — объявление из ?a=, с которого начать (без него — первое важное); onSeen(id) — показано.
export default function AnnouncementBoard({ items, initialId, readIds, onSeen, onShare }) {
  const [currentId, setCurrentId] = useState(() => {
    const start = items.find((item) => String(item.id) === initialId) ?? items.find((item) => item.important) ?? items[0];
    return start.id;
  });

  const current = items.find((item) => item.id === currentId) ?? items[0];
  const index = items.indexOf(current);
  const step = (delta) => setCurrentId(items[(index + delta + items.length) % items.length].id);

  useEffect(() => {
    onSeen(String(current.id));
  }, [current.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="ann7-board">
      <div className="ann7-stage">
        <StoryCard
          item={current}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
          onShare={onShare}
        />
        <span className="ann7-layer is-first" aria-hidden="true" />
        <span className="ann7-layer is-second" aria-hidden="true" />
      </div>

      <div className="ann7-list">
        {items.map((item) => {
          const id = String(item.id);
          const active = item === current;
          return (
            <AnnouncementRow
              key={item.id}
              item={item}
              active={active}
              read={!active && readIds.includes(id)}
              unread={!readIds.includes(id)}
              onOpen={() => setCurrentId(item.id)}
            />
          );
        })}
      </div>
    </div>
  );
}
