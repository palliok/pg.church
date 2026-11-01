import { t } from '../i18n.js';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSong, useSongs, useSongSearch } from '../api/songs.js';
import LoadStatus from '../components/LoadStatus.jsx';
import SongCard from '../components/SongCard.jsx';
import { CloseIcon, SearchIcon } from '../components/Icons.jsx';
import './Songs.css';

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

// На десктопе рядом со списком карточка песни: клик по строке открывает песню в ней, а не на отдельной странице.
const DESKTOP = '(min-width: 861px)';

// Строка списка: номер, название, строка текста и тональность; совпадения с поиском подсвечены.
function SongRow({ song, line, term, isNum, active, onPick }) {
  const pick = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || !window.matchMedia(DESKTOP).matches) return;
    e.preventDefault();
    onPick(song.id);
  };

  return (
    <Link to={`/songs/${song.id}`} className={`sb-row${active ? ' is-active' : ''}`} onClick={pick} aria-current={active || undefined}>
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
  const [sort, setSort] = useState('num');
  // Песня, выбранная в списке для карточки на десктопе; новый поиск выбор сбрасывает.
  const [picked, setPicked] = useState(null);

  const { songs, loading, error, retry } = useSongs();
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

  // Список: по номеру или по алфавиту с заголовками-буквами.
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
  const preview = matched.find((s) => s.id === picked) || exact || matched[0] || songs[0];
  const { song: previewSong } = useSong(preview?.id ?? null);

  // Пока грузится следующая песня, карточка показывает предыдущую, а не пропадает.
  const [shown, setShown] = useState(null);
  if (previewSong && previewSong !== shown) setShown(previewSong);

  const search = (value) => {
    setQ(value);
    setPicked(null);
  };

  return (
    <div className="page-enter container page-bg" style={{ '--title-chars': t('Сборник песен').length }}>
      <h1 className="page-title page-title--bg">Сборник песен</h1>

      <div className="songs-layout">
        {/* Поиск и список — один и тот же блок для телефона и десктопа (resources/design_handoff_songbook_mobile):
            поиск закрепляется при прокрутке, рядом — сортировка. На десктопе справа — превью песни. */}
        <div>
          <div className="sb-bar">
            <label className="sb-search">
              <span className="sb-search-icon"><SearchIcon size={22} /></span>
              <input value={q} onChange={(e) => search(e.target.value)} placeholder={t('Номер, название или строка')} />
              {q && (
                <button type="button" className="sb-clear" onClick={() => search('')} aria-label={t('Очистить')}>
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
              <SongRow key={row.song.id} song={row.song} line={foundLines.get(row.song.id) ?? row.song.line} term={term} isNum={isNum}
                active={row.song.id === preview?.id} onPick={setPicked} />
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

        <div className="desktop-only sb-preview">
          {shown && <SongCard song={shown} nav={<Link to={`/songs/${shown.id}`} className="song-card-back">Открыть песню ↗</Link>} />}
        </div>
      </div>
    </div>
  );
}
