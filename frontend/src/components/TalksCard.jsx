import { useState } from 'react';
import { t } from '../i18n.js';
import { useChurch } from '../api/church.js';
import { churchToday } from '../api/dates.js';
import LongArrow from './LongArrow.jsx';
import './TalksCard.css';

const WEEKDAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

// Личные беседы со служителями — тёмная карточка как «Ближайшее» в расписании: день недели на фоне,
// кто принимает сегодня (или в ближайший день бесед), часы; стрелками листаются остальные дни.
// Стоит на главной под «О церкви». Без данных её нет.
export default function TalksCard({ className = '' }) {
  const duty = useChurch()?.duty;
  const days = groupByDay(duty?.shifts ?? []);
  if (days.length === 0) return null;

  return <Talks days={days} hours={duty.hours} className={className} />;
}

// Те же беседы без переключателя — как колонка расписания на главной: сверху тёмная карточка с часами,
// под ней дни строками с плашками, как даты событий; плашка ближайшего дня бесед тёмная.
// Для десктопной страницы «О церкви», рядом с адресом.
export function TalksDays({ className = '' }) {
  const duty = useChurch()?.duty;
  const days = groupByDay(duty?.shifts ?? []);
  if (days.length === 0) return null;

  const today = isoWeekday(churchToday());
  const nearest = days[Math.max(0, days.findIndex((d) => d.weekday >= today))];

  return (
    <section className={`talks-days ${className}`} aria-labelledby="talks-days-title">
      <div className="talks-days-head">
        <h2 id="talks-days-title" className="talks-label">Личные беседы со служителями</h2>
        {duty.hours && <span className="talks-days-hours">{duty.hours}</span>}
        <p className="talks-days-other">В другое время для беседы есть дежурный администратор</p>
      </div>
      <ul className="talks-days-list">
        {days.map((day) => {
          const near = day === nearest;
          const when = near && nearWord(day.weekday, today);
          return (
            <li key={day.weekday} className={`talks-day${near ? ' is-near' : ''}`}>
              <span className="talks-day-tile">
                <span className="talks-day-dow">{day.dow}</span>
                {when && <span className="talks-day-when">{when}</span>}
              </span>
              <span className="talks-day-names">
                {day.names.map((name) => <span key={name}>{shortName(name)}</span>)}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function Talks({ days, hours, className }) {
  const today = isoWeekday(churchToday());
  const nearest = Math.max(0, days.findIndex((d) => d.weekday >= today));
  const [index, setIndex] = useState(nearest);
  const day = days[index] ?? days[0];
  const step = (by) => setIndex((i) => (i + by + days.length) % days.length);

  return (
    <section className={`talks ${className}`} aria-label={t('Личные беседы со служителями')}>
      <div className="talks-card">
        <span className="talks-mark" aria-hidden="true">{day.dow}</span>
        <h2 className="talks-label">
          Личные беседы со служителями
          <span className="talks-when"> · {whenLabel(day.weekday, today)}</span>
        </h2>
        <span className="talks-names" aria-live="polite">
          {day.names.map((name) => <span key={name}>{shortName(name)}</span>)}
        </span>
        <span className="talks-foot">
          {hours ? <span className="talks-hours">{hours}</span> : <span />}
          {days.length > 1 && (
            <span className="talks-nav">
              <button type="button" aria-label="Предыдущий день" onClick={() => step(-1)}>
                <LongArrow width={18} stroke={3} />
              </button>
              <button type="button" aria-label="Следующий день" onClick={() => step(1)}>
                <LongArrow width={18} stroke={3} />
              </button>
            </span>
          )}
        </span>
      </div>
      <p className="talks-other">В другое время для беседы есть дежурный администратор</p>
    </section>
  );
}

// День недели по ISO: 1 — понедельник, 7 — воскресенье, как weekday в API.
function isoWeekday({ year, month, day }) {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay() || 7;
}

// «Сегодня», «Завтра» или название дня недели.
function whenLabel(weekday, today) {
  if (weekday === today) return t('Сегодня');
  if (weekday === today % 7 + 1) return t('Завтра');
  return t(WEEKDAYS[weekday - 1]);
}

// «Сегодня» или «Завтра» над ближайшим днём; для дальних дней подпись не нужна — день уже написан.
function nearWord(weekday, today) {
  if (weekday === today) return t('Сегодня');
  return weekday === today % 7 + 1 ? t('Завтра') : null;
}

// Фамилия и имя без отчества — крупным шрифтом полное ФИО не помещается в строку.
function shortName(name) {
  return name.split(' ').slice(0, 2).join(' ');
}

// Служители одного дня — вместе: в среду беседуют двое. API отдаёт смены по порядку дней.
function groupByDay(shifts) {
  const days = [];
  for (const shift of shifts) {
    const last = days.at(-1);
    if (last?.weekday === shift.weekday) last.names.push(shift.name);
    else days.push({ weekday: shift.weekday, dow: shift.dow, names: [shift.name] });
  }
  return days;
}
