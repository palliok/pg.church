import { t } from '../i18n.js';
import { Link, useParams } from 'react-router-dom';
import ArrowKnob from '../components/ArrowKnob.jsx';
import LoadStatus from '../components/LoadStatus.jsx';
import { useEvent } from '../api/events.js';

export default function SermonDetail() {
  const { id } = useParams();
  const { event: ev, loading, error, retry } = useEvent(id);
  const sermon = ev?.sermon;

  if (loading || error) {
    return (
      <div className="page-enter container" style={{ padding: '40px 16px' }}>
        <LoadStatus error={error} onRetry={retry} />
      </div>
    );
  }

  if (!ev || !sermon) {
    return (
      <div className="page-enter container" style={{ padding: '40px 16px' }}>
        <p>Проповедь не найдена.</p>
        <Link to="/schedule">← К расписанию</Link>
      </div>
    );
  }

  return (
    <div className="page-enter container" style={{ padding: '20px 16px 48px' }}>
      <Link to={`/schedule/${ev.id}`} className="pill-btn" style={{ padding: '0 20px 0 8px', height: 44, background: 'var(--c-panel)', color: '#231f20' }}>
        <ArrowKnob size={30} bg="#fff" fg="#231f20" symbol="←" />
        <span style={{ fontSize: 11.5 }}>{ev.title}</span>
      </Link>

      <div className="split-layout" style={{ marginTop: 20 }}>
        <div>
          <div className="card-row">
            <span className="icon-circle" style={{ width: 58, height: 58, background: 'var(--c-second)', color: '#fff', fontFamily: 'var(--f-sans)', fontWeight: 700, fontSize: 22 }}>
              {sermon.initial}
            </span>
            <span>
              <span style={{ display: 'block', fontFamily: 'var(--f-sans)', fontWeight: 700, fontSize: 17 }}>{sermon.name}</span>
              <span style={{ display: 'block', font: '600 10.5px var(--f-sans)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--c-gray-text-soft)', marginTop: 4 }}>
                {sermon.role} · {ev.day} {ev.mon}
              </span>
            </span>
          </div>

          <div className="h-display" style={{ fontSize: 'clamp(32px, 5vw, 52px)', marginTop: 22, maxWidth: 760 }}>{sermon.topic}</div>
          <div style={{ display: 'inline-flex', background: 'var(--c-main)', padding: '8px 13px', borderRadius: 8, fontFamily: 'var(--f-sans)', fontWeight: 700, fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase', marginTop: 16 }}>
            {sermon.ref}
          </div>
          <p style={{ font: '500 17px/1.65 var(--f-sans)', color: '#3a3a3a', margin: '18px 0 0', maxWidth: 720 }}>{sermon.intro}</p>

          <div className="eyebrow" style={{ marginTop: 30 }}>План</div>
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 8, maxWidth: 760 }}>
            {sermon.outline.map((o) => (
              <div key={o.n} style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: '16px 0', borderTop: '1px solid var(--c-line-soft)' }}>
                <span className="icon-circle" style={{ width: 32, height: 32, background: '#231f20', color: '#fff', fontFamily: 'var(--f-sans)', fontWeight: 700, fontSize: 13, flex: '0 0 auto' }}>
                  {o.n}
                </span>
                <span style={{ flex: 1, font: '500 16.5px/1.5 var(--f-sans)' }}>{o.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ borderRadius: 22, background: 'var(--c-panel)', padding: '24px 26px' }}>
            <div className="eyebrow">Ключевой стих</div>
            <div style={{ font: 'italic 500 19px/1.55 var(--f-sans)', marginTop: 12 }}>{sermon.verse}</div>
            <div style={{ fontFamily: 'var(--f-sans)', fontWeight: 700, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--c-second)', marginTop: 12 }}>
              {sermon.verseRef}
            </div>
          </div>
          {(sermon.audioUrl || sermon.durationLabel) && (
            <a href={sermon.audioUrl ?? '#listen'} className="pill-btn" style={{ padding: '8px 8px 8px 22px', background: '#231f20', color: '#fff' }}>
              <span style={{ flex: 1, fontSize: 13 }}>{sermon.durationLabel ?? t('Слушать')}</span>
              <ArrowKnob size={40} bg="var(--c-main)" fg="#231f20" symbol="▶" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
