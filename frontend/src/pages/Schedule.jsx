import { t } from '../i18n.js';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useChurch } from '../api/church.js';
import { useEvents } from '../api/events.js';
import CalendarOptions from '../components/CalendarOptions.jsx';
import LoadStatus from '../components/LoadStatus.jsx';

const MONTHS = [t('Январь'),t('Февраль'),t('Март'),t('Апрель'),t('Май'),t('Июнь'),t('Июль'),t('Август'),t('Сентябрь'),t('Октябрь'),t('Ноябрь'),t('Декабрь')];

// Месяц с годом: в расписании могут оказаться, например, декабрь и январь.
const monthKey = (e) => `${e.year}-${e.month}`;

export default function Schedule() {
  const { events, loading, error, retry } = useEvents();
  const [monthFilter, setMonthFilter] = useState('all');
  const feed = useChurch()?.calendarFeed;
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyFeedLink() {
    try {
      await navigator.clipboard.writeText(feed.ics);
      setCopied(true);
    } catch {
      window.prompt(t('Ссылка на расписание'), feed.ics);
    }
  }

  const filtered = useMemo(() => {
    if (monthFilter === 'all') return events;
    return events.filter((e) => monthKey(e) === monthFilter);
  }, [events, monthFilter]);

  const months = useMemo(() => [...new Map(events.map((e) => [monthKey(e), e.month]))], [events]);

  return (
    <div className="page-enter container" style={{ padding: '26px 16px 48px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <h1 className="h-display" style={{ fontSize: 'clamp(34px, 6vw, 54px)' }}>Расписание</h1>
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
          {months.map(([key, month]) => (
            <button
              key={key}
              onClick={() => setMonthFilter(key)}
              className="pill-btn"
              style={{
                padding: '11px 18px', fontSize: 11.5,
                background: monthFilter === key ? '#0d0d0d' : 'var(--c-panel)',
                color: monthFilter === key ? '#fff' : '#0d0d0d',
              }}
            >
              {MONTHS[month - 1]}
            </button>
          ))}
          {feed && (
            <button
              onClick={() => setSubscribeOpen((open) => !open)}
              aria-expanded={subscribeOpen}
              className="pill-btn"
              style={{ padding: '11px 18px', fontSize: 11.5, background: subscribeOpen ? '#0d0d0d' : 'var(--c-main)', color: subscribeOpen ? '#fff' : '#0d0d0d' }}
            >
              <span aria-hidden="true">+</span>
              <span>Подписаться</span>
            </button>
          )}
        </div>
      </div>

      {feed && subscribeOpen && (
        <div style={{ marginTop: 16, marginLeft: 'auto', maxWidth: 420, padding: 16, borderRadius: 22, background: 'var(--c-panel)' }}>
          <div style={{ font: '500 13px/1.5 var(--f-body)', color: 'var(--c-gray-text)' }}>
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

        {(loading || error) && <LoadStatus error={error} onRetry={retry} />}

        {!loading && !error && filtered.length === 0 && (
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
