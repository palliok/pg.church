import { getLang, t } from '../i18n.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useChurch } from '../api/church.js';
import { churchToday, dayLabel, daysFromToday } from '../api/dates.js';
import { EVENT_CATEGORIES, categoryLabel, useEvents } from '../api/events.js';
import CalendarOptions from '../components/CalendarOptions.jsx';
import { EventTag, LiveTag } from '../components/EventVisuals.jsx';
import LoadStatus from '../components/LoadStatus.jsx';
import './Schedule.css';

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

// Цвет точки и тон карточки дня в календаре «Месяц» по направлению; главное событие недели — всегда синее.
const CATEGORY_STYLE = {
  'Богослужение': { color: '#02407d', tone: 'purple' },
  'Таинство': { color: '#02407d', tone: 'purple' },
  'Молодёжь': { color: '#f9c9a5', tone: 'peach' },
  'Дети': { color: '#f9c9a5', tone: 'peach' },
  'Молитва': { color: '#231f20', tone: 'dark' },
  'Общение': { color: '#00b7e3', tone: 'yellow' },
};
const LEGEND = [['#02407d', 'Богослужение'], ['#f9c9a5', 'Молодёжь и дети'], ['#231f20', 'Молитва'], ['#00b7e3', 'Общение']];

const categoryColor = (e) => CATEGORY_STYLE[e.category]?.color ?? '#a3a3a3';
const eventTone = (e) => (e.main ? 'purple' : CATEGORY_STYLE[e.category]?.tone ?? 'dark');
const pad = (n) => String(n).padStart(2, '0');
// Сколько прошедших дней с событиями лента текущего месяца показывает сразу, остальные — по кнопке.
const PAST_DAYS_SHOWN = 1;
const daysInMonth = ({ year, month }) => new Date(Date.UTC(year, month, 0)).getUTCDate();

// «1 событие», «3 события», «7 событий»; в английском — event/events, в киргизском форма одна.
function eventsWord(n) {
  if (getLang() === 'en') return n === 1 ? 'event' : 'events';

  const a = n % 10;
  const b = n % 100;
  if (a === 1 && b !== 11) return t('событие');
  if (a >= 2 && a <= 4 && (b < 10 || b >= 20)) return t('события');
  return t('событий');
}

// Расписание по месяцам (макет «Расписание» в resources/): лента событий по дням или календарь месяца,
// фильтр по направлению и трансляции. На телефоне фильтр открывается шторкой снизу.
export default function Schedule() {
  const today = useMemo(() => churchToday(), []);
  const [ym, setYm] = useState({ year: today.year, month: today.month });
  const [view, setView] = useState('list');
  const [pickedDay, setPickedDay] = useState(null);
  const [cats, setCats] = useState([]);
  const [online, setOnline] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showPast, setShowPast] = useState(false);
  const barRef = useRef(null);

  const dim = daysInMonth(ym);
  const monthPrefix = `${ym.year}-${pad(ym.month)}`;
  const { events, loading, error, retry } = useEvents({ from: `${monthPrefix}-01`, to: `${monthPrefix}-${pad(dim)}`, limit: 200 });

  const filtered = useMemo(
    () => events.filter((e) => (cats.length === 0 || cats.includes(e.category)) && (!online || e.live)),
    [events, cats, online],
  );

  const byDay = useMemo(() => {
    const map = new Map();
    for (const e of filtered) map.set(e.day, [...(map.get(e.day) ?? []), e]);
    return map;
  }, [filtered]);

  const isCurrentMonth = ym.year === today.year && ym.month === today.month;
  const todayNum = isCurrentMonth ? today.day : null;
  // Выбранный день календаря: сегодня, а в другом месяце — первый день с событиями.
  const selDay = pickedDay ?? todayNum ?? (byDay.keys().next().value ?? 1);
  // В текущем месяце виден только последний прошедший день с событиями, раньше — под кнопкой «Показать прошедшие».
  const pastDays = todayNum == null ? [] : [...byDay.keys()].filter((day) => day < todayNum);
  const hiddenDays = pastDays.slice(0, Math.max(0, pastDays.length - PAST_DAYS_SHOWN));
  const hiddenCount = hiddenDays.reduce((sum, day) => sum + byDay.get(day).length, 0);
  const listReady = !loading && !error && view === 'list';

  const filterCount = cats.length + (online ? 1 : 0);

  // В новом месяце прошедшие дни снова спрятаны.
  function goMonth(next) {
    setYm(next);
    setPickedDay(null);
    setShowPast(false);
  }

  function toggleCat(category) {
    setCats((list) => (list.includes(category) ? list.filter((c) => c !== category) : [...list, category]));
  }

  function resetFilters() {
    setCats([]);
    setOnline(false);
  }

  const viewTabs = [['list', 'Лента', 'Списком'], ['month', 'Месяц', 'Календарь']];

  return (
    <div className="page-enter container page-bg" style={{ '--title-chars': t('Расписание').length }}>
      <div className="sched-head">
        <div className="sched-title-row">
          <h1 className="page-title page-title--bg">Расписание</h1>
          <button type="button" className="sched-m sched-filter-round" onClick={() => setSheetOpen(true)} aria-label="Фильтр">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M7 12h10M10 18h4" /></svg>
            {filterCount > 0 && <span className="sched-badge">{filterCount}</span>}
          </button>
        </div>
      </div>

      {/* Одна строка: «Показать прошедшие», выбор месяца и «Подписаться». На телефоне выбор месяца — отдельным рядом сверху. */}
      <div className="sched-bar" ref={barRef}>
        {listReady && hiddenCount > 0 && (
          <button type="button" className="sched-feed-past" onClick={() => setShowPast((on) => !on)} aria-expanded={showPast}>
            {/* Через t(): React меняет текст в том же узле, а translatePage() такие правки не видит. */}
            <span>{showPast ? t('Скрыть прошедшие') : t('Показать прошедшие')}</span>
            {!showPast && <span className="sched-feed-past-count">{hiddenCount} {eventsWord(hiddenCount)}</span>}
          </button>
        )}
        <div className="sched-controls">
          <button type="button" className={`sched-d sched-today${isCurrentMonth ? ' is-on' : ''}`} onClick={() => { goMonth({ year: today.year, month: today.month }); setPickedDay(today.day); }}>
            Сегодня
          </button>
          <MonthNav ym={ym} onChange={goMonth} />
          <div className="sched-seg">
            {viewTabs.map(([key, desktopLabel, mobileLabel]) => (
              <button key={key} type="button" className={view === key ? 'is-on' : ''} onClick={() => setView(key)} aria-pressed={view === key}>
                <span className="sched-d">{desktopLabel}</span>
                <span className="sched-m">{mobileLabel}</span>
              </button>
            ))}
          </div>
        </div>
        <Subscribe />
      </div>

      <div className="sched-toolbar">
        <button type="button" className={`sched-d sched-filter-btn${panelOpen || filterCount ? ' is-on' : ''}`} onClick={() => setPanelOpen((open) => !open)} aria-expanded={panelOpen}>
          <span>Фильтры</span>
          {filterCount > 0 && <span className="sched-badge sched-badge--inline">{filterCount}</span>}
          <span className="sched-caret" aria-hidden="true">▾</span>
        </button>
        {cats.map((category) => (
          <button key={category} type="button" className="sched-d sched-active-chip" onClick={() => toggleCat(category)}>
            {categoryLabel(category)} ✕
          </button>
        ))}
        {online && (
          <button type="button" className="sched-d sched-active-chip is-live" onClick={() => setOnline(false)}>
            <span>С трансляцией</span> ✕
          </button>
        )}
        {filterCount > 0 && (
          <>
            <button type="button" className="sched-d sched-reset" onClick={resetFilters}>Сбросить</button>
            <button type="button" className="sched-m sched-reset" onClick={resetFilters}>Сбросить фильтры</button>
          </>
        )}
      </div>

      {panelOpen && (
        <div className="sched-d sched-panel">
          <div className="sched-label">Направление</div>
          <div className="sched-chips">
            {EVENT_CATEGORIES.map((category) => (
              <button key={category} type="button" className={`sched-chip${cats.includes(category) ? ' is-on' : ''}`} onClick={() => toggleCat(category)} aria-pressed={cats.includes(category)}>
                {categoryLabel(category)}
              </button>
            ))}
          </div>
          <div className="sched-label" style={{ marginTop: 20 }}>Формат</div>
          <div className="sched-chips">
            <button type="button" className={`sched-chip sched-chip--live${online ? ' is-on' : ''}`} onClick={() => setOnline((on) => !on)} aria-pressed={online}>
              Есть трансляция
            </button>
          </div>
        </div>
      )}

      {(loading || error) ? (
        <div style={{ marginTop: 24 }}><LoadStatus error={error} onRetry={retry} /></div>
      ) : view === 'list' ? (
        <ListView key={monthPrefix} byDay={byDay} ym={ym} todayNum={todayNum} hiddenDayCount={showPast ? 0 : hiddenDays.length} showPast={showPast} startRef={barRef} hasFilters={filterCount > 0} onReset={resetFilters} />
      ) : (
        <MonthView ym={ym} byDay={byDay} selDay={selDay} todayNum={todayNum} onPick={setPickedDay} />
      )}

      {sheetOpen && (
        <FilterSheet
          cats={cats}
          online={online}
          count={filtered.length}
          onToggleCat={toggleCat}
          onOnline={setOnline}
          onReset={resetFilters}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </div>
  );
}

// ‹ Месяц ▾ Год ▾ › — выпадающие списки закрываются кликом мимо и клавишей Esc.
function MonthNav({ ym, onChange }) {
  const [picker, setPicker] = useState(null);
  const ref = useRef(null);
  const thisYear = churchToday().year;
  const years = [thisYear - 1, thisYear, thisYear + 1, thisYear + 2];

  useEffect(() => {
    if (!picker) return undefined;

    const onPointer = (event) => { if (!ref.current?.contains(event.target)) setPicker(null); };
    const onKey = (event) => { if (event.key === 'Escape') setPicker(null); };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [picker]);

  function shift(delta) {
    const index = ym.year * 12 + ym.month - 1 + delta;
    setPicker(null);
    onChange({ year: Math.floor(index / 12), month: (index % 12) + 1 });
  }

  function pick(next) {
    setPicker(null);
    onChange(next);
  }

  return (
    <div className="sched-monthnav" ref={ref}>
      <button type="button" className="sched-arrow" onClick={() => shift(-1)} aria-label="Предыдущий месяц">‹</button>
      <div className="sched-pick sched-pick--month">
        <button type="button" onClick={() => setPicker(picker === 'month' ? null : 'month')} aria-expanded={picker === 'month'}>
          {t(MONTHS[ym.month - 1])} <span className="sched-pick-caret" aria-hidden="true">▾</span>
        </button>
        {picker === 'month' && (
          <div className="sched-pop sched-pop--months">
            {MONTHS.map((name, index) => (
              <button key={name} type="button" className={index + 1 === ym.month ? 'is-on' : ''} onClick={() => pick({ year: ym.year, month: index + 1 })}>
                {t(name)}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="sched-pick sched-pick--year">
        <button type="button" onClick={() => setPicker(picker === 'year' ? null : 'year')} aria-expanded={picker === 'year'}>
          {ym.year} <span className="sched-pick-caret" aria-hidden="true">▾</span>
        </button>
        {picker === 'year' && (
          <div className="sched-pop sched-pop--years">
            {years.map((year) => (
              <button key={year} type="button" className={year === ym.year ? 'is-on' : ''} onClick={() => pick({ year, month: ym.month })}>
                {year}
              </button>
            ))}
          </div>
        )}
      </div>
      <button type="button" className="sched-arrow" onClick={() => shift(1)} aria-label="Следующий месяц">›</button>
    </div>
  );
}

// Лента (макет resources/design_handoff_schedule_2b): слева крупное число и день недели, справа события дня.
// Прошедшие дни бледнее, сегодняшний — на серой подложке. Первые hiddenDayCount дней спрятаны под кнопку
// «Показать прошедшие» — она в строке над лентой (startRef). key у ListView — месяц.
function ListView({ byDay, ym, todayNum, hiddenDayCount, showPast, startRef, hasFilters, onReset }) {
  const feedRef = useRef(null);

  const visibleDays = [...byDay.entries()].slice(hiddenDayCount);

  // В ленте текущего месяца сразу прокручиваем к строке над ней: над сегодняшним днём только эта строка
  // и последний прошедший день. Срабатывает, когда лента появляется (новый месяц,
  // возврат из «Месяц»), — от смены фильтров страница не прыгает.
  useEffect(() => {
    if (todayNum != null) startRef.current?.scrollIntoView({ block: 'start' });
  }, [todayNum, startRef]);

  // Раскрытые прошедшие дни появляются выше — показываем их с начала месяца.
  useEffect(() => {
    if (showPast) feedRef.current?.firstElementChild?.scrollIntoView({ block: 'start' });
  }, [showPast]);

  if (byDay.size === 0) {
    return (
      <div className="sched-empty">
        <div className="sched-empty-title">Ничего не нашлось</div>
        {hasFilters ? (
          <>
            <div className="sched-empty-text">В этом месяце по выбранным фильтрам собраний нет. Снимите часть условий или переключите месяц.</div>
            <button type="button" className="sched-empty-btn" onClick={onReset}>Сбросить фильтры</button>
          </>
        ) : (
          <div className="sched-empty-text">В этом месяце собраний нет.</div>
        )}
      </div>
    );
  }

  return (
    <div className="sched-feed-wrap">
      <div className="sched-feed" ref={feedRef}>
        {visibleDays.map(([day, items]) => {
          const classes = ['sched-feed-day', day === todayNum && 'is-today', daysFromToday({ ...ym, day }) < 0 && 'is-past'].filter(Boolean).join(' ');

          return (
            <section key={day} className={classes}>
              <div className="sched-feed-date">
                <span className="sched-feed-num">{day}</span>
                <span className="sched-feed-dow">
                  <span className="sched-d">{items[0].dowLabel}</span>
                  <span className="sched-m">{items[0].dowShort}</span>
                  {day === todayNum && (
                    <>
                      <span className="sched-d sched-feed-today">Сегодня</span>
                      <span className="sched-m sched-feed-today-dot" role="img" aria-label={t('Сегодня')} />
                    </>
                  )}
                </span>
              </div>
              <div className="sched-feed-items">
                {items.map((e) => <FeedEvent key={e.id} event={e} />)}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

// Событие ленты: название, время, первый абзац описания и теги — эфир, направление, место.
// На телефоне теги — под описанием, на десктопе — справа.
function FeedEvent({ event: e }) {
  return (
    <Link to={`/schedule/${e.id}`} className="sched-feed-event">
      <span className="sched-feed-main">
        <span className="sched-feed-title">{e.title}</span>
        <span className="sched-feed-time">{e.timeRange}</span>
        {e.desc[0] && <span className="sched-feed-desc">{e.desc[0]}</span>}
      </span>
      <span className="sched-feed-tags">
        {e.live && <LiveTag />}
        {e.category && <EventTag>{categoryLabel(e.category)}</EventTag>}
        {e.place && <EventTag>{e.place}</EventTag>}
      </span>
    </Link>
  );
}

// Календарь месяца и события выбранного дня.
function MonthView({ ym, byDay, selDay, todayNum, onPick }) {
  const dim = daysInMonth(ym);
  const startDow = (new Date(Date.UTC(ym.year, ym.month - 1, 1)).getUTCDay() + 6) % 7;
  const cells = Array.from({ length: Math.ceil((startDow + dim) / 7) * 7 }, (_, i) => i - startDow + 1);
  const dayEvents = byDay.get(selDay) ?? [];
  const selDow = (startDow + selDay - 1) % 7;
  const selLabel = `${dayLabel({ ...ym, day: selDay })} · ${t(['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'][selDow]).toLowerCase()}`;

  return (
    <div className="sched-monthview">
      <div className="sched-calendar">
        <div className="sched-weekdays">
          {WEEKDAYS.map((name) => <div key={name}>{t(name)}</div>)}
        </div>
        <div className="sched-grid">
          {cells.map((day, i) => {
            const inMonth = day >= 1 && day <= dim;
            if (!inMonth) return <span key={i} className="sched-cell is-out" />;

            const items = byDay.get(day) ?? [];
            const classes = ['sched-cell', items.length && 'has-events', day === selDay && 'is-sel', day === todayNum && 'is-today'].filter(Boolean).join(' ');

            return (
              <button key={i} type="button" className={classes} onClick={() => onPick(day)} aria-pressed={day === selDay}>
                <span className="sched-cell-num">{day}</span>
                <span className="sched-cell-foot">
                  <span className="sched-cell-time">{items.length ? items[0].timeLabel + (items.length > 1 ? `  +${items.length - 1}` : '') : ''}</span>
                  <span className="sched-cell-dots">
                    {items.slice(0, 4).map((e) => <span key={e.id} className="sched-dot" style={{ '--dot': categoryColor(e) }} />)}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
        <div className="sched-legend">
          {LEGEND.map(([color, label]) => (
            <span key={label}><span className="sched-dot" style={{ '--dot': color }} />{label}</span>
          ))}
        </div>
      </div>

      <div className="sched-day">
        <div className="sched-day-head">
          <span className="sched-day-label">{selLabel}</span>
          <span className="sched-day-count">{dayEvents.length} {eventsWord(dayEvents.length)}</span>
        </div>
        <div className="sched-day-list">
          {dayEvents.map((e) => (
            <Link key={e.id} to={`/schedule/${e.id}`} className={`sched-day-card tone-${eventTone(e)}`}>
              <span style={{ minWidth: 0, flex: 1 }} className="sched-day-body">
                <span className="sched-day-time">{e.timeRange}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span className="sched-day-title">{e.title}</span>
                  <span className="sched-day-place">{[e.place, e.category && categoryLabel(e.category)].filter(Boolean).join(' · ')}</span>
                </span>
              </span>
              <span className="sched-day-knob" aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
        {dayEvents.length === 0 && (
          <div className="sched-day-empty">
            <div className="sched-empty-title">Нет встреч</div>
            <div className="sched-empty-text">
              <span className="sched-d">Выберите день с цветной точкой — там есть собрание.</span>
              <span className="sched-m">В этот день собраний не запланировано.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Фильтр на телефоне — шторка снизу, как в макете приложения.
function FilterSheet({ cats, online, count, onToggleCat, onOnline, onReset, onClose }) {
  useEffect(() => {
    const overflow = document.body.style.overflow;
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="sched-sheet">
      <div className="sched-sheet-backdrop" onClick={onClose} />
      <div className="sched-sheet-panel" role="dialog" aria-modal="true" aria-labelledby="sched-sheet-title">
        <div className="sched-sheet-handle" aria-hidden="true" />
        <div className="sched-sheet-head">
          <span id="sched-sheet-title" className="sched-sheet-title">Фильтр</span>
          <button type="button" className="sched-sheet-reset" onClick={onReset}>Сбросить</button>
        </div>

        <div className="sched-label sched-label--sheet">Направление</div>
        <div className="sched-chips">
          {EVENT_CATEGORIES.map((category) => (
            <button key={category} type="button" className={`sched-chip${cats.includes(category) ? ' is-on' : ''}`} onClick={() => onToggleCat(category)} aria-pressed={cats.includes(category)}>
              {categoryLabel(category)}
            </button>
          ))}
        </div>

        <div className="sched-label sched-label--sheet">Место</div>
        <div className="sched-cells">
          <button type="button" className={online ? '' : 'is-on'} onClick={() => onOnline(false)} aria-pressed={!online}>Любое место</button>
          <button type="button" className={online ? 'is-on' : ''} onClick={() => onOnline(true)} aria-pressed={online}>Есть трансляция</button>
        </div>

        <button type="button" className="sched-sheet-apply" onClick={onClose}>
          <span>{t('Показать')} {count} {eventsWord(count)}</span>
          <span className="sched-sheet-go" aria-hidden="true">→</span>
        </button>
      </div>
    </div>,
    document.body,
  );
}

// «+ Подписаться»: расписание календарём, который обновляется сам.
function Subscribe() {
  const feed = useChurch()?.calendarFeed;
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!feed) return null;

  async function copyFeedLink() {
    try {
      await navigator.clipboard.writeText(feed.ics);
      setCopied(true);
    } catch {
      window.prompt(t('Ссылка на расписание'), feed.ics);
    }
  }

  return (
    <div className="sched-subscribe">
      <button type="button" className={`sched-subscribe-btn${open ? ' is-on' : ''}`} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span aria-hidden="true">+</span>
        <span>Подписаться</span>
      </button>
      {open && (
        <div className="sched-subscribe-pop">
          <div style={{ font: '500 13px/1.5 var(--f-sans)', color: 'var(--c-gray-text)' }}>
            Расписание появится в вашем календаре и будет обновляться само.
          </div>
          <CalendarOptions
            options={[
              { label: t('Google Календарь'), href: feed.google, external: true },
              { label: t('Apple, Outlook и другие'), href: feed.webcal },
              { label: copied ? t('Ссылка скопирована') : t('Скопировать ссылку'), hint: t('Для Яндекс Календаря и других: «Подписаться по ссылке»'), onClick: copyFeedLink },
            ]}
          />
        </div>
      )}
    </div>
  );
}
