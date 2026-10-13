import { usePosts } from '../api/posts.js';
import LoadStatus from '../components/LoadStatus.jsx';

// Обложка записи без картинки — один из градиентов по кругу.
const GRADIENTS = [
  'linear-gradient(150deg, var(--c-second), var(--c-ink))',
  'linear-gradient(150deg, var(--c-main), var(--c-second))',
  'linear-gradient(150deg, #f9c9a5, #ef8f5a)',
];

const cover = (post, index) => ({
  backgroundImage: post.image ? `url(${JSON.stringify(post.image)})` : GRADIENTS[index % GRADIENTS.length],
  backgroundSize: 'cover',
  backgroundPosition: 'center',
});

const isEmpty = ({ posts, loading, error }) => !loading && !error && posts.length === 0;

function Chip({ label, color = '#fff', text = '#0d0d0d' }) {
  return (
    <span style={{ background: color, color: text, padding: '3px 9px', borderRadius: 999, fontFamily: 'var(--f-head)', fontWeight: 700, fontSize: 8.5, letterSpacing: '.06em', textTransform: 'uppercase' }}>
      {label}
    </span>
  );
}

export default function Media() {
  const news = usePosts('news');
  const blog = usePosts('blog');

  return (
    <div className="page-enter container" style={{ padding: '26px 16px 48px' }}>
      <div className="eyebrow">Медиа</div>
      <h1 className="h-display" style={{ fontSize: 'clamp(34px, 6vw, 54px)', marginTop: 8 }}>Новости и блог</h1>

      {isEmpty(news) && isEmpty(blog) && (
        <div style={{ marginTop: 30, padding: '56px 20px', borderRadius: 24, background: 'var(--c-panel)', textAlign: 'center' }}>
          <div className="h-display" style={{ fontSize: 22 }}>Ничего не нашлось</div>
        </div>
      )}

      {!isEmpty(news) && (
      <div style={{ marginTop: 30 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>Новости</div>
        {(news.loading || news.error) && <LoadStatus error={news.error} onRetry={news.retry} />}
        <div className="news-grid">
          {news.posts.map((n, i) => (
            <article key={n.id} style={{ borderRadius: 22, background: 'var(--c-panel)', padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ height: 100, borderRadius: 14, ...cover(n, i) }} />
              <div style={{ font: '600 11px var(--f-body)', color: 'var(--c-gray-text-soft)', textTransform: 'uppercase', letterSpacing: '.1em' }}>{n.date}</div>
              <h3 className="h-display" style={{ fontSize: 19, textTransform: 'none' }}>{n.title}</h3>
              {n.excerpt && <p style={{ font: '500 13.5px/1.55 var(--f-body)', color: 'var(--c-gray-text)', margin: 0 }}>{n.excerpt}</p>}
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                {n.tags.map((t) => <Chip key={t.label} {...t} />)}
              </div>
            </article>
          ))}
        </div>
      </div>
      )}

      {!isEmpty(blog) && (
      <div style={{ marginTop: 40 }}>
        <div className="eyebrow" style={{ marginBottom: 14 }}>Блог</div>
        {(blog.loading || blog.error) && <LoadStatus error={blog.error} onRetry={blog.retry} />}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {blog.posts.map((b, i) => (
            <div key={b.id} className="card-row" style={{ padding: '16px 0', borderTop: '1px solid var(--c-line-soft)' }}>
              <span style={{ flex: '0 0 30px', font: '600 11px var(--f-head)', color: 'var(--c-gray-text-mute)' }}>{`${String(i + 1).padStart(2, '0')} /`}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontFamily: 'var(--f-head)', fontWeight: 600, fontSize: 17 }}>{b.title}</span>
                <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>
                  {b.tags.map((t) => <Chip key={t.label} {...t} />)}
                </div>
              </span>
              <span style={{ flex: '0 0 auto', width: 52, height: 40, borderRadius: 10, ...cover(b, i) }} />
            </div>
          ))}
        </div>
      </div>
      )}
    </div>
  );
}
