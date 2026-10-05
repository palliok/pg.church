import { t } from '../i18n.js';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { events } from '../data/mockData.js';

const MONTHS = [t('Январь'),t('Февраль'),t('Март'),t('Апрель'),t('Май'),t('Июнь'),t('Июль'),t('Август'),t('Сентябрь'),t('Октябрь'),t('Ноябрь'),t('Декабрь')];

export default function Schedule() {
  const [monthFilter, setMonthFilter] = useState('all');

  const filtered = useMemo(() => {
    if (monthFilter === 'all') return events;
    return events.filter((e) => e.month === monthFilter);
  }, [monthFilter]);

  const months = useMemo(() => [...new Set(events.map((e) => e.month))], []);

  return (
    <div className="page-enter container" style={{ padding: '26px 16px 48px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <div className="eyebrow">Жизнь церкви</div>
          <h1 className="h-display" style={{ fontSize: 'clamp(34px, 6vw, 54px)', marginTop: 8 }}>Расписание</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setMonthFilter('all')}
            className="pill-btn"
            style={{
              padding: '11px 18px', fontSize: 11.5,
              background: monthFilter === 'all' ? '#0d0d0d' : 'var(--c-panel)',
              color: monthFilter === 'all' ? '#fff' : '#0d0d0d',
            }}
          >
            Все
          </button>
          {months.map((m) => (
            <button
              key={m}
              onClick={() => setMonthFilter(m)}
              className="pill-btn"
              style={{
                padding: '11px 18px', fontSize: 11.5,
                background: monthFilter === m ? '#0d0d0d' : 'var(--c-panel)',
                color: monthFilter === m ? '#fff' : '#0d0d0d',
              }}
            >
              {MONTHS[m]}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 26 }}>
        {filtered.map((e) => (
          <Link
            key={e.id}
            to={`/schedule/${e.id}`}
            className="card-row"
            style={{
              padding: '20px 22px',
              borderRadius: 22,
              background: 'var(--c-panel)',
              color: '#0d0d0d',
              transition: 'transform .18s ease',
            }}
          >
            <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, borderRadius: 16, background: '#0d0d0d', color: '#fff', flex: '0 0 auto' }}>
              <span style={{ fontFamily: 'var(--f-head)', fontWeight: 800, fontSize: 19, lineHeight: 1 }}>{e.day}</span>
              <span style={{ fontFamily: 'var(--f-head)', fontWeight: 700, fontSize: 8, letterSpacing: '.1em', opacity: 0.7, marginTop: 2 }}>{e.mon}</span>
            </span>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: 'block', fontFamily: 'var(--f-head)', fontWeight: 700, fontSize: 'clamp(18px, 3vw, 24px)', letterSpacing: '-.02em' }}>{e.title}</span>
              <span style={{ display: 'block', font: '600 12.5px var(--f-body)', opacity: 0.72, marginTop: 6 }}>{e.when}</span>
            </span>
            {e.live && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 13px', borderRadius: 999, background: 'rgba(13,13,13,.08)', fontFamily: 'var(--f-head)', fontWeight: 700, fontSize: 9.5, letterSpacing: '.1em', textTransform: 'uppercase' }}>
                <span className="live-dot" />Трансляция
              </span>
            )}
            <span style={{ color: 'var(--c-gray-text-mute)' }}>↗</span>
          </Link>
        ))}

        {filtered.length === 0 && (
          <div style={{ padding: '56px 20px', borderRadius: 24, background: 'var(--c-panel)', textAlign: 'center' }}>
            <div className="h-display" style={{ fontSize: 22 }}>Ничего не нашлось</div>
            <div style={{ font: '500 14px/1.5 var(--f-body)', color: 'var(--c-gray-text)', marginTop: 8 }}>
              В этом месяце собраний нет по выбранным фильтрам.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
