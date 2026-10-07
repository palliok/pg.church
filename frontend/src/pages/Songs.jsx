import { t } from '../i18n.js';
import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { songs } from '../data/mockData.js';

const CATS = [t('Все'), t('Поклонение'), t('Прославление'), t('Гимны')];

export default function Songs() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(t('Все'));
  const [favs, setFavs] = useState(() => new Set([songs[0]?.id]));
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    return songs.filter((s) => {
      const matchesCat = cat === t('Все') || s.category === cat;
      const matchesQ =
        !q.trim() ||
        s.title.toLowerCase().includes(q.trim().toLowerCase()) ||
        String(s.num).includes(q.trim());
      return matchesCat && matchesQ;
    });
  }, [q, cat]);

  const exact = songs.find((s) => String(s.num) === q.trim());
  const preview = exact || filtered[0] || songs[0];

  function toggleFav(id) {
    setFavs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="page-enter container" style={{ padding: '26px 16px 48px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <div className="eyebrow">{t('Поклонная гора')} · {songs.length} {t('песен')}</div>
          <h1 className="h-display" style={{ fontSize: 'clamp(34px, 6vw, 54px)', marginTop: 8 }}>Сборник песен</h1>
        </div>
        <button
          onClick={() => navigate(`/songs/${songs[Math.floor(Math.random() * songs.length)].id}`)}
          className="pill-btn"
          style={{ padding: '0 8px 0 20px', height: 46, background: 'var(--c-panel)', color: '#0d0d0d' }}
        >
          <span style={{ fontSize: 11.5 }}>Случайная</span>
          <span className="icon-circle" style={{ width: 32, height: 32, background: '#fff', fontSize: 15 }}>⤮</span>
        </button>
      </div>

      <div className="songs-layout" style={{ marginTop: 24 }}>
        <div style={{ borderRadius: 24, background: 'var(--c-panel)', padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 6px 0 16px', height: 52, borderRadius: 999, background: '#fff' }}>
            <span style={{ color: 'var(--c-gray-text-soft)', fontSize: 15 }}>⌕</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('Название, номер или строка')}
              style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'none', font: '500 14.5px var(--f-body)', color: '#0d0d0d' }}
            />
            {q && (
              <button onClick={() => setQ('')} aria-label={t('Очистить')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--c-gray-text-mute)' }}>✕</button>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 14 }}>
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className="pill-btn"
                style={{ padding: '9px 15px', fontSize: 11, background: cat === c ? '#0d0d0d' : '#fff', color: cat === c ? '#fff' : '#0d0d0d' }}
              >
                {c}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}>
            <span className="eyebrow" style={{ fontSize: 9.5 }}>Список</span>
            <span style={{ font: '600 11.5px var(--f-body)', color: 'var(--c-gray-text-soft)' }}>{filtered.length} {t('песен')}</span>
          </div>

          <div className="hide-scrollbar" style={{ maxHeight: 520, overflowY: 'auto', marginTop: 4, paddingRight: 4 }}>
            {filtered.map((s) => (
              <div key={s.id} className="card-row" style={{ padding: '10px 8px', borderRadius: 14 }}>
                <Link to={`/songs/${s.id}`} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, color: 'inherit' }}>
                  <span style={{ flex: '0 0 30px', fontFamily: 'var(--f-head)', fontWeight: 800, fontSize: 15, color: 'var(--c-gray-text-mute)' }}>{s.num}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontFamily: 'var(--f-head)', fontWeight: 600, fontSize: 17, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</span>
                    <span style={{ display: 'block', font: '500 12px var(--f-body)', color: 'var(--c-gray-text)', marginTop: 2 }}>{s.sub}</span>
                  </span>
                </Link>
                <button
                  onClick={() => toggleFav(s.id)}
                  aria-label={t('В избранное')}
                  style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 16, color: favs.has(s.id) ? 'var(--c-second)' : 'var(--c-gray-text-mute)' }}
                >
                  {favs.has(s.id) ? '★' : '☆'}
                </button>
              </div>
            ))}
            {filtered.length === 0 && (
              <div style={{ padding: '34px 18px', borderRadius: 18, background: '#fff', textAlign: 'center', marginTop: 10 }}>
                <div className="h-display" style={{ fontSize: 16 }}>Ничего не нашлось</div>
                <div style={{ font: '500 12.5px/1.5 var(--f-body)', color: 'var(--c-gray-text-soft)', marginTop: 6 }}>
                  Попробуйте номер песни или слово из первой строки.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="desktop-only">
          {preview && (
            <div style={{ borderRadius: 24, overflow: 'hidden', background: '#fff', boxShadow: '0 0 0 1px rgba(13,13,13,.08)' }}>
              <div
                style={{
                  position: 'relative', minHeight: 200, backgroundColor: '#0d0d0d',
                  backgroundImage: 'linear-gradient(to top, rgba(5,5,5,.92) 10%, rgba(5,5,5,.2) 70%), repeating-linear-gradient(135deg, rgba(255,255,255,.04) 0 11px, transparent 11px 22px)',
                  color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '28px 30px',
                }}
              >
                <div className="eyebrow" style={{ color: 'rgba(255,255,255,.5)' }}>№ {preview.num} · {preview.category}</div>
                <div className="h-display" style={{ fontSize: 40, marginTop: 10 }}>{preview.title}</div>
              </div>
              <div style={{ padding: 28 }}>
                {preview.lyrics.map((line, i) => (
                  <p key={i} style={{ margin: '0 0 14px', font: line.length < 20 ? '700 11px var(--f-head)' : '500 16px/1.7 var(--f-body)', color: line.length < 20 ? 'var(--c-gray-text-mute)' : '#1a1a1a', textTransform: line.length < 20 ? 'uppercase' : 'none', letterSpacing: line.length < 20 ? '.12em' : 'normal', whiteSpace: 'pre-line' }}>
                    {line}
                  </p>
                ))}
                <Link to={`/songs/${preview.id}`} className="pill-btn" style={{ marginTop: 10, padding: '11px 20px', background: '#0d0d0d', color: '#fff', fontSize: 11.5 }}>
                  Открыть песню ↗
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
