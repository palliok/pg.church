import { t } from '../i18n.js';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSong, useSongCategories, useSongs, useSongSearch } from '../api/songs.js';
import LoadStatus from '../components/LoadStatus.jsx';
import SongText from '../components/SongText.jsx';

const ALL = 'all';

// Значение, которое не менялось delay миллисекунд: чтобы не слать запрос на каждую букву.
function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export default function Songs() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(ALL);
  const [favs, setFavs] = useState(() => new Set());
  const navigate = useNavigate();

  const { songs, loading, error, retry } = useSongs();
  const categories = useSongCategories();
  const term = q.trim();
  const searchedTerm = useDebounced(term, 250);
  const found = useSongSearch(searchedTerm);

  const filtered = useMemo(() => {
    if (!term) return cat === ALL ? songs : songs.filter((s) => s.categoryId === cat);

    // По названию и номеру ищем сразу в загруженном списке, по строке текста — на сервере.
    const ids = new Set(found && searchedTerm === term ? found.map((s) => s.id) : []);
    const matches = (s) => ids.has(s.id) || s.title.toLowerCase().includes(term.toLowerCase()) || String(s.num).startsWith(term);

    return songs.filter((s) => matches(s) && (cat === ALL || s.categoryId === cat));
  }, [songs, found, searchedTerm, term, cat]);

  const exact = songs.find((s) => String(s.num) === term);
  const preview = exact || filtered[0] || songs[0];
  const { song: previewSong } = useSong(preview?.id ?? null);

  function toggleFav(id) {
    setFavs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="page-enter container">
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <h1 className="page-title">Сборник песен</h1>
        </div>
        <button
          onClick={() => songs.length > 0 && navigate(`/songs/${songs[Math.floor(Math.random() * songs.length)].id}`)}
          className="pill-btn"
          style={{ padding: '0 8px 0 20px', height: 46, background: 'var(--c-panel)', color: '#231f20' }}
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
              style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'none', font: '500 14.5px var(--f-sans)', color: '#231f20' }}
            />
            {q && (
              <button onClick={() => setQ('')} aria-label={t('Очистить')} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--c-gray-text-mute)' }}>✕</button>
            )}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 14 }}>
            {[{ id: ALL, name: t('Все') }, ...categories].map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className="pill-btn"
                style={{ padding: '9px 15px', fontSize: 11, background: cat === c.id ? '#231f20' : '#fff', color: cat === c.id ? '#fff' : '#231f20' }}
              >
                {c.name}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 18 }}>
            <span className="eyebrow" style={{ fontSize: 9.5 }}>Список</span>
            <span style={{ font: '600 11.5px var(--f-sans)', color: 'var(--c-gray-text-soft)' }}>{filtered.length} {t('песен')}</span>
          </div>

          <div className="hide-scrollbar" style={{ maxHeight: 520, overflowY: 'auto', marginTop: 4, paddingRight: 4 }}>
            {filtered.map((s) => (
              <div key={s.id} className="card-row" style={{ padding: '10px 8px', borderRadius: 14 }}>
                <Link to={`/songs/${s.id}`} style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 12, color: 'inherit' }}>
                  <span style={{ flex: '0 0 30px', fontFamily: 'var(--f-sans)', fontWeight: 700, fontSize: 15, color: 'var(--c-gray-text-mute)' }}>{s.num}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontFamily: 'var(--f-sans)', fontWeight: 600, fontSize: 17, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</span>
                    <span style={{ display: 'block', font: '500 12px var(--f-sans)', color: 'var(--c-gray-text)', marginTop: 2 }}>{s.sub}</span>
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
            {(loading || error) && <LoadStatus error={error} onRetry={retry} />}
            {!loading && !error && filtered.length === 0 && (
              <div style={{ padding: '34px 18px', borderRadius: 18, background: '#fff', textAlign: 'center', marginTop: 10 }}>
                <div className="h-display" style={{ fontSize: 16 }}>Ничего не нашлось</div>
                <div style={{ font: '500 12.5px/1.5 var(--f-sans)', color: 'var(--c-gray-text-soft)', marginTop: 6 }}>
                  Попробуйте номер песни или слово из первой строки.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="desktop-only">
          {preview && (
            <div style={{ borderRadius: 24, overflow: 'hidden', background: '#fff', boxShadow: '0 0 0 1px rgba(35,31,32,.08)' }}>
              <div
                style={{
                  position: 'relative', minHeight: 200, backgroundColor: '#231f20',
                  backgroundImage: 'linear-gradient(to top, rgba(5,5,5,.92) 10%, rgba(5,5,5,.2) 70%), repeating-linear-gradient(135deg, rgba(255,255,255,.04) 0 11px, transparent 11px 22px)',
                  color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '28px 30px',
                }}
              >
                <div className="eyebrow" style={{ color: 'rgba(255,255,255,.5)' }}>№ {preview.num} · {preview.category}</div>
                <div className="h-display" style={{ fontSize: 40, marginTop: 10 }}>{preview.title}</div>
              </div>
              <div style={{ padding: 28 }}>
                {previewSong && <SongText sections={previewSong.sections} gap={14} />}
                <Link to={`/songs/${preview.id}`} className="pill-btn" style={{ marginTop: 10, padding: '11px 20px', background: '#231f20', color: '#fff', fontSize: 11.5 }}>
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
