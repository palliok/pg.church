import { t } from '../i18n.js';
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSong, useSongCategories, useSongs, useSongSearch } from '../api/songs.js';
import LoadStatus from '../components/LoadStatus.jsx';
import SongText from '../components/SongText.jsx';
import { CloseIcon, SearchIcon } from '../components/Icons.jsx';
import './Songs.css';

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

// Текст с подсвеченными вхождениями needle (без учёта регистра).
function highlight(text, needle) {
  if (!text || !needle) return text;

  const lower = text.toLowerCase();
  const query = needle.toLowerCase();
  const parts = [];
  let from = 0;

  for (let at = lower.indexOf(query); at !== -1; at = lower.indexOf(query, from)) {
    if (at > from) parts.push(text.slice(from, at));
    parts.push(<mark key={at} className="sb-hl">{text.slice(at, at + query.length)}</mark>);
    from = at + query.length;
  }
  if (from < text.length) parts.push(text.slice(from));

  return parts;
}

// Буква для заголовка в режиме «А—Я»: первая буква названия, Ё — вместе с Е.
function firstLetter(title) {
  const letter = title.match(/[\p{L}\d]/u)?.[0]?.toUpperCase() ?? '#';
  return letter === 'Ё' ? 'Е' : letter;
}

// Строка списка на телефоне: номер, название, строка текста и тональность; совпадения с поиском подсвечены.
function SongRow({ song, line, term, isNum }) {
  return (
    <Link to={`/songs/${song.id}`} className="sb-row">
      <span className="sb-num">{isNum ? highlight(String(song.num), term) : song.num}</span>
      <span className="sb-text">
        <span className="sb-title">{isNum ? song.title : highlight(song.title, term)}</span>
        {line && <span className="sb-line">{isNum ? line : highlight(line, term)}</span>}
      </span>
      {song.key && <span className="sb-key">{song.key}</span>}
    </Link>
  );
}

export default function Songs() {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState(ALL);
  const [favs, setFavs] = useState(() => new Set());

  const [sort, setSort] = useState('num');
  const navigate = useNavigate();

  const { songs, loading, error, retry } = useSongs();
  const categories = useSongCategories();
  const term = q.trim();
  // Одни цифры — это номер: ищем по его началу прямо в списке, без запроса.
  const isNum = /^\d+$/.test(term);
  const searchedTerm = useDebounced(isNum ? '' : term, 250);
  const found = useSongSearch(searchedTerm);

  // Строки с совпадением от сервера: по ним видно, почему песня нашлась.
  const foundLines = useMemo(
    () => new Map(found && searchedTerm === term ? found.map((s) => [s.id, s.line]) : []),
    [found, searchedTerm, term],
  );

  const matched = useMemo(() => {
    if (!term) return songs;
    if (isNum) return songs.filter((s) => String(s.num).startsWith(term));

    // По названию ищем сразу в загруженном списке, по строке текста — на сервере.
    return songs.filter((s) => foundLines.has(s.id) || s.title.toLowerCase().includes(term.toLowerCase()));
  }, [songs, foundLines, term, isNum]);

  const filtered = cat === ALL ? matched : matched.filter((s) => s.categoryId === cat);

  // Список телефона: по номеру или по алфавиту с заголовками-буквами.
  const rows = useMemo(() => {
    if (sort === 'num') return matched.map((song) => ({ song }));

    const result = [];
    let letter = null;
    [...matched].sort((a, b) => a.title.localeCompare(b.title, 'ru')).forEach((song) => {
      const next = firstLetter(song.title);
      if (next !== letter) result.push({ letter: (letter = next) });
      result.push({ song });
    });

    return result;
  }, [matched, sort]);

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
    <div className="page-enter container page-bg" style={{ '--title-chars': t('Сборник песен').length }}>
      <h1 className="page-title page-title--bg">Сборник песен</h1>

      {/* Телефон (resources/design_handoff_songbook_mobile): поиск закрепляется при прокрутке, рядом — сортировка. */}
      <div className="mobile-only">
        <div className="sb-bar">
          <label className="sb-search">
            <span className="sb-search-icon"><SearchIcon size={22} /></span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('Номер, название или строка')} />
            {q && (
              <button type="button" className="sb-clear" onClick={() => setQ('')} aria-label={t('Очистить')}>
                <CloseIcon size={18} />
              </button>
            )}
          </label>
          <button
            type="button"
            className={`sb-sort${sort === 'alpha' ? ' is-alpha' : ''}`}
            onClick={() => setSort(sort === 'num' ? 'alpha' : 'num')}
            aria-label={t('Сортировка')}
          >
            {sort === 'num' ? '1—9' : t('А—Я')}
          </button>
        </div>

        <div className="sb-list">
          {rows.map((row) => (row.letter ? (
            <div key={`letter-${row.letter}`} className="sb-letter">
              <span>{row.letter}</span>
            </div>
          ) : (
            <SongRow key={row.song.id} song={row.song} line={foundLines.get(row.song.id) ?? row.song.line} term={term} isNum={isNum} />
          )))}
          {(loading || error) && <LoadStatus error={error} onRetry={retry} />}
          {!loading && !error && matched.length === 0 && (
            <div className="sb-empty">
              <span className="sb-empty-title">Ничего не нашлось</span>
              <span>Попробуйте номер песни или слово из первой строки.</span>
            </div>
          )}
        </div>
      </div>

      <div className="desktop-only" style={{ textAlign: 'right' }}>
        <button
          onClick={() => songs.length > 0 && navigate(`/songs/${songs[Math.floor(Math.random() * songs.length)].id}`)}
          className="pill-btn"
          style={{ padding: '0 8px 0 20px', height: 46, background: 'var(--c-panel)', color: '#231f20' }}
        >
          <span style={{ fontSize: 11.5 }}>Случайная</span>
          <span className="icon-circle" style={{ width: 32, height: 32, background: '#fff', fontSize: 15 }}>⤮</span>
        </button>
      </div>

      <div className="songs-layout desktop-only" style={{ marginTop: 24 }}>
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
