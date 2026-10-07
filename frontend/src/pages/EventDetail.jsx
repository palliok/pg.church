import { Link, useParams } from 'react-router-dom';
import ArrowKnob from '../components/ArrowKnob.jsx';
import { events, sermons, songs } from '../data/mockData.js';

export default function EventDetail() {
  const { id } = useParams();
  const ev = events.find((e) => e.id === id);

  if (!ev) {
    return (
      <div className="page-enter container" style={{ padding: '40px 16px' }}>
        <p>Событие не найдено.</p>
        <Link to="/schedule">← К расписанию</Link>
      </div>
    );
  }

  const preacher = ev.preachers?.[0] ? sermons[ev.preachers[0].id] : null;
  const eventHymns = songs.filter((s) => ev.hymnIds?.includes(s.id));

  return (
    <div className="page-enter container" style={{ padding: '20px 16px 48px' }}>
      <Link to="/schedule" className="pill-btn" style={{ padding: '0 20px 0 8px', height: 44, background: 'var(--c-panel)', color: '#0d0d0d' }}>
        <ArrowKnob size={30} bg="#fff" fg="#0d0d0d" symbol="←" />
        <span style={{ fontSize: 11.5 }}>Расписание</span>
      </Link>

      <div className="split-layout" style={{ marginTop: 16 }}>
        <div>
          <div
            style={{
              position: 'relative', borderRadius: 24, overflow: 'hidden', minHeight: 360,
              backgroundColor: '#0d0d0d',
              backgroundImage: 'linear-gradient(to top, rgba(5,5,5,.92) 10%, rgba(5,5,5,.12) 62%, rgba(5,5,5,.45) 100%), repeating-linear-gradient(135deg, rgba(255,255,255,.035) 0 11px, transparent 11px 22px)',
              color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 32,
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <span style={{ background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.24)', padding: '7px 13px', borderRadius: 8, fontFamily: 'var(--f-head)', fontWeight: 700, fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                {ev.tag}
              </span>
              {ev.main && (
                <span style={{ background: 'var(--c-main)', color: '#0d0d0d', padding: '7px 13px', borderRadius: 8, fontFamily: 'var(--f-head)', fontWeight: 700, fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                  Главное
                </span>
              )}
              {ev.live && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.24)', padding: '6px 13px', borderRadius: 8, fontFamily: 'var(--f-head)', fontWeight: 700, fontSize: 9.5, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                  <span className="live-dot" />Трансляция
                </span>
              )}
            </div>
            <div className="h-display" style={{ fontSize: 'clamp(34px, 6vw, 56px)', marginTop: 18 }}>{ev.title}</div>
            <div style={{ font: '600 15px var(--f-body)', color: 'rgba(255,255,255,.72)', marginTop: 12 }}>{ev.when}</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 22, maxWidth: 720 }}>
            {ev.desc.map((p, i) => (
              <p key={i} style={{ font: '500 16px/1.65 var(--f-body)', color: '#3a3a3a', margin: 0 }}>{p}</p>
            ))}
          </div>

          {preacher && (
            <div style={{ marginTop: 28 }}>
              <div className="eyebrow">Проповедь</div>
              <Link
                to={`/schedule/${ev.id}/sermon`}
                style={{ display: 'block', borderRadius: 22, background: 'var(--c-panel)', padding: '24px 26px', color: '#0d0d0d', marginTop: 12 }}
              >
                <div className="card-row">
                  <span className="icon-circle" style={{ width: 48, height: 48, background: 'var(--c-second)', color: '#fff', fontFamily: 'var(--f-head)', fontWeight: 800, fontSize: 18 }}>
                    {preacher.initial}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontFamily: 'var(--f-head)', fontWeight: 700, fontSize: 16 }}>{preacher.name}</span>
                    <span style={{ display: 'block', font: '600 10.5px var(--f-body)', letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--c-gray-text-soft)', marginTop: 4 }}>{preacher.role}</span>
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: 'var(--f-head)', fontWeight: 700, fontSize: 10.5, letterSpacing: '.08em', textTransform: 'uppercase' }}>
                    Конспект <ArrowKnob size={34} />
                  </span>
                </div>
                <div className="h-display" style={{ fontSize: 26, marginTop: 18, textTransform: 'none' }}>{preacher.topic}</div>
                <div style={{ font: '700 13px var(--f-body)', color: 'var(--c-gray-text)', marginTop: 8 }}>{preacher.ref}</div>
              </Link>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ borderRadius: 22, background: 'var(--c-panel)', padding: '22px 24px' }}>
            <div className="eyebrow">Когда</div>
            <div className="card-row" style={{ marginTop: 14 }}>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 14, background: '#0d0d0d', color: '#fff', flex: '0 0 auto' }}>
                <span style={{ fontFamily: 'var(--f-head)', fontWeight: 800, fontSize: 18, lineHeight: 1 }}>{ev.day}</span>
                <span style={{ fontFamily: 'var(--f-head)', fontWeight: 700, fontSize: 8, letterSpacing: '.1em', opacity: 0.7, marginTop: 2 }}>{ev.mon}</span>
              </span>
              <span>
                <span style={{ display: 'block', fontFamily: 'var(--f-head)', fontWeight: 700, fontSize: 19 }}>{ev.timeLabel}</span>
                <span style={{ display: 'block', font: '600 12.5px var(--f-body)', color: 'var(--c-gray-text)', marginTop: 4 }}>{ev.dowLabel}</span>
              </span>
            </div>
            <div className="card-row" style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--c-line-soft)' }}>
              <span className="icon-circle" style={{ width: 52, height: 52, background: '#fff', flex: '0 0 auto' }}>
                <span style={{ width: 15, height: 15, background: 'var(--c-signal)', borderRadius: '50% 50% 50% 0', transform: 'rotate(-45deg)' }} />
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <div className="eyebrow">Где</div>
                <div style={{ font: '600 14.5px var(--f-body)', marginTop: 5 }}>{ev.place} · {ev.addr}</div>
              </span>
              <ArrowKnob size={38} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <a href="#calendar" className="pill-btn" style={{ flex: 1, padding: '7px 7px 7px 20px', background: '#0d0d0d', color: '#fff' }}>
                <span style={{ flex: 1, fontSize: 12 }}>В календарь</span>
                <ArrowKnob size={36} bg="var(--c-main)" fg="#0d0d0d" symbol="＋" />
              </a>
              <ArrowKnob as="a" href="#share" size={50} bg="#fff" fg="#0d0d0d" />
            </div>
          </div>

          {eventHymns.length > 0 && (
            <div style={{ borderRadius: 22, background: 'var(--c-panel)', padding: '22px 24px' }}>
              <div className="eyebrow">Гимны служения</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                {eventHymns.map((s) => (
                  <Link key={s.id} to={`/songs/${s.id}`} className="card-row" style={{ padding: '8px 0', color: '#0d0d0d' }}>
                    <span style={{ fontFamily: 'var(--f-head)', fontWeight: 800, fontSize: 15, color: 'var(--c-gray-text-mute)' }}>{s.num}</span>
                    <span style={{ flex: 1, fontFamily: 'var(--f-head)', fontWeight: 600, fontSize: 15 }}>{s.title}</span>
                    <span>↗</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
