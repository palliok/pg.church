import { news, blog } from '../data/mockData.js';

function Chip({ label, color = '#fff', text = '#0d0d0d' }) {
  return (
    <span style={{ background: color, color: text, padding: '3px 9px', borderRadius: 999, fontFamily: 'var(--f-head)', fontWeight: 700, fontSize: 8.5, letterSpacing: '.06em', textTransform: 'uppercase' }}>
      {label}
    </span>
  );
}

export default function Media() {
  return (
    <div className="page-enter container" style={{ padding: '26px 16px 48px' }}>
      <div className="eyebrow">Медиа</div>
      <h1 className="h-display" style={{ fontSize: 'clamp(34px, 6vw, 54px)', marginTop: 8 }}>Новости и блог</h1>

      <div style={{ marginTop: 30 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>Новости</div>
        <div className="news-grid">
          {news.map((n) => (
            <article key={n.id} style={{ borderRadius: 22, background: 'var(--c-panel)', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ height: 100, borderRadius: 14, backgroundImage: n.gradient }} />
              <div style={{ font: '600 11px var(--f-body)', color: 'var(--c-gray-text-soft)', textTransform: 'uppercase', letterSpacing: '.1em' }}>{n.date}</div>
              <h3 className="h-display" style={{ fontSize: 19, textTransform: 'none' }}>{n.title}</h3>
              <p style={{ font: '500 13.5px/1.55 var(--f-body)', color: 'var(--c-gray-text)', margin: 0 }}>{n.excerpt}</p>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                {n.tags.map((t) => <Chip key={t.label} {...t} />)}
              </div>
            </article>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 40 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>Блог</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {blog.map((b, i) => (
            <div key={b.id} className="card-row" style={{ padding: '16px 0', borderTop: '1px solid var(--c-line-soft)' }}>
              <span style={{ flex: '0 0 30px', font: '600 11px var(--f-head)', color: 'var(--c-gray-text-mute)' }}>{`0${i + 1} /`}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontFamily: 'var(--f-head)', fontWeight: 600, fontSize: 17 }}>{b.title}</span>
                <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
                  {b.tags.map((t) => <Chip key={t.label} {...t} />)}
                </div>
              </span>
              <span style={{ flex: '0 0 auto', width: 52, height: 40, borderRadius: 10, backgroundImage: b.gradient }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
