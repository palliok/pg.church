import { t } from '../i18n.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSong, useSongs, useSongSearch } from '../api/songs.js';
import LoadStatus from '../components/LoadStatus.jsx';
import { SongCardSkeleton, SongListSkeleton } from '../components/Skeletons.jsx';
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

// Слова запроса так же, как на бэке (Text::searchWords): строчные, «ё» как «е», знаки препинания — разделители.
function searchWords(text) {
  return [...new Set(text.toLowerCase().replaceAll('ё', 'е').split(/[^\p{L}\p{N}]+/u).filter(Boolean))];
}

// Все слова запроса есть в тексте — с начала какого-нибудь слова, как ищет бэк.
function hasWords(text, words) {
  const tokens = searchWords(text);
  return words.every((word) => tokens.some((token) => token.startsWith(word)));
}

// Текст с подсвеченными словами запроса: с начала слова, без учёта регистра, «е» и «ё» — одно.
// Найденное с опечаткой не подсвечивается.
function highlight(text, words) {
  if (!text || !words.length) return text;

  // В словах только буквы и цифры (searchWords), экранировать нечего; длинные — первыми.
  const pattern = [...words].sort((a, b) => b.length - a.length).map((word) => word.replaceAll('е', '[её]')).join('|');
  const parts = [];
  let from = 0;

  for (const match of text.matchAll(new RegExp(`(?<![\\p{L}\\p{N}])(?:${pattern})`, 'giu'))) {
    if (match.index > from) parts.push(text.slice(from, match.index));
    parts.push(<mark key={match.index} className="sb-hl">{match[0]}</mark>);
    from = match.index + match[0].length;
  }
  if (from < text.length) parts.push(text.slice(from));

  return parts;
}

// Буква для заголовка в режиме «А—Я»: первая буква названия, Ё — вместе с Е.
function firstLetter(title) {
  const letter = title.match(/[\p{L}\d]/u)?.[0]?.toUpperCase() ?? '#';
  return letter === 'Ё' ? 'Е' : letter;
}

// Где был список, когда открыли песню: поиск, сортировка и прокрутка. Вернувшись к сборнику
// (кнопкой «Назад» или «← К сборнику»), попадаешь на то же место, а не к первой песне.
// Хранится в sessionStorage — пока открыта вкладка; недоступное хранилище просто ничего не помнит.
// Место нужно только на один возврат: прочитав, стираем, и следующий заход в сборник — с начала, по алфавиту.
const SAVED_KEY = 'songs:list';

function loadSaved() {
  try {
    return JSON.parse(sessionStorage.getItem(SAVED_KEY)) ?? {};
  } catch {
    return {};
  }
}

function forgetSaved() {
  try {
    sessionStorage.removeItem(SAVED_KEY);
  } catch {
    // Нечего стирать.
  }
}

function save(state) {
  try {
    sessionStorage.setItem(SAVED_KEY, JSON.stringify({ ...state, y: window.scrollY }));
  } catch {
    // Без хранилища возврат будет к началу списка.
  }
}

// Буква, к которой сейчас прокручен список: последняя, чья первая песня уже дошла до низа закреплённой шапки.
function currentLetter(list, top) {
  let current = null;
  for (const heading of list.querySelectorAll('[data-letter]')) {
    const first = heading.nextElementSibling;
    if (!first || first.getBoundingClientRect().top > top + heading.offsetHeight + 1) break;
    current = heading.dataset.letter;
  }
  return current;
}

// Полоска букв над списком «А—Я»: тап прокручивает к букве, текущая подсвечена и видна в полоске.
function LetterBar({ letters, active, onJump }) {
  const ref = useRef(null);

  // Текущую букву держим в видимой части полоски — прокручиваем только саму полоску, не страницу.
  useEffect(() => {
    const strip = ref.current;
    const button = strip?.querySelector('.is-active');
    if (!button) return;
    const left = button.offsetLeft - (strip.clientWidth - button.offsetWidth) / 2;
    strip.scrollTo({ left, behavior: 'smooth' });
  }, [active]);

  return (
    <nav ref={ref} className="sb-abc hide-scrollbar" aria-label={t('Алфавитный указатель')}>
      {letters.map((letter) => (
        <button key={letter} type="button" className={letter === active ? 'is-active' : undefined}
          aria-current={letter === active || undefined} onClick={() => onJump(letter)}>
          {letter}
        </button>
      ))}
    </nav>
  );
}

// На десктопе рядом со списком карточка песни: клик по строке открывает песню в ней, а не на отдельной странице.
const DESKTOP = '(min-width: 861px)';

// Строка списка: номер, название, строка текста и тональность; совпадения с поиском подсвечены.
// variant — буква варианта, где нашлась строка: песня откроется сразу на нём.
function SongRow({ song, line, variant, words, isNum, active, onPick, onOpen }) {
  const pick = (e) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (!window.matchMedia(DESKTOP).matches) {
      onOpen();
      return;
    }
    e.preventDefault();
    onPick({ id: song.id, variant });
  };

  return (
    <Link to={`/songs/${song.id}${variant ? `?v=${encodeURIComponent(variant)}` : ''}`} className={`sb-row${active ? ' is-active' : ''}`} onClick={pick} aria-current={active || undefined}>
      <span className="sb-num">{isNum ? highlight(String(song.num), words) : song.num}{variant && <small>{variant}</small>}</span>
      <span className="sb-text">
        <span className="sb-title">{isNum ? song.title : highlight(song.title, words)}</span>
        {line && <span className="sb-line">{isNum ? line : highlight(line, words)}</span>}
      </span>
      {song.key && <span className="sb-key">{song.key}</span>}
    </Link>
  );
}

export default function Songs() {
  const [saved] = useState(loadSaved);
  const [q, setQ] = useState(saved.q ?? '');
  // По умолчанию — по алфавиту: песню чаще ищут по названию, чем по номеру.
  const [sort, setSort] = useState(saved.sort ?? 'alpha');
  // Прокрутка, к которой вернуться, когда список снова построится; один раз.
  const restoreY = useRef(saved.y ?? null);
  // Песня, выбранная в списке для карточки на десктопе, и её вариант: { id, variant }; новый поиск выбор сбрасывает.
  const [picked, setPicked] = useState(null);
  // В эффекте, а не при чтении: в StrictMode начальное значение считается дважды.
  useEffect(forgetSaved, []);

  const { songs, loading, error, retry } = useSongs();
  const term = q.trim();
  // Одни цифры — это номер: ищем по его началу прямо в списке, без запроса.
  const isNum = /^\d+$/.test(term);
  const searchedTerm = useDebounced(isNum ? '' : term, 250);
  const found = useSongSearch(searchedTerm);

  // Строки с совпадением от сервера (и буква варианта, где оно нашлось): по ним видно, почему песня нашлась.
  const foundLines = useMemo(
    () => new Map(found && searchedTerm === term ? found.map((s) => [s.id, { line: s.line, variant: s.variant ?? null }]) : []),
    [found, searchedTerm, term],
  );

  const words = useMemo(() => searchWords(term), [term]);

  const matched = useMemo(() => {
    if (!term) return songs;
    if (isNum) return songs.filter((s) => String(s.num).startsWith(term));

    // Ответ сервера — в его порядке, самые подходящие выше. Пока его нет, ищем по названию прямо в списке.
    if (found && searchedTerm === term) return found;
    return songs.filter((s) => hasWords(s.title, words));
  }, [songs, found, searchedTerm, term, words, isNum]);

  // Список группами: по номеру — одна группа без буквы, по алфавиту — группа на каждую букву.
  // У каждой буквы своя группа, чтобы её заголовок при прокрутке выталкивался следующим, а не ложился под него.
  const groups = useMemo(() => {
    if (sort === 'num') return [{ letter: null, songs: matched }];

    const result = [];
    [...matched].sort((a, b) => a.title.localeCompare(b.title, 'ru')).forEach((song) => {
      const letter = firstLetter(song.title);
      if (result.at(-1)?.letter !== letter) result.push({ letter, songs: [] });
      result.at(-1).songs.push(song);
    });

    return result;
  }, [matched, sort]);

  // Буквы для полоски — только в полном списке по алфавиту: в результатах поиска она лишняя.
  const letters = useMemo(() => (sort === 'alpha' && !term ? groups.map((group) => group.letter) : []), [groups, sort, term]);

  const barRef = useRef(null);
  const listRef = useRef(null);
  // Высота закреплённой шапки (поиск и полоска букв): под неё встают заголовки-буквы и прыжок к букве.
  const [barHeight, setBarHeight] = useState(null);
  const [activeLetter, setActiveLetter] = useState(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return undefined;
    const observer = new ResizeObserver(() => setBarHeight(bar.offsetHeight));
    observer.observe(bar);
    return () => observer.disconnect();
  }, []);

  // Шапка закреплена вверху экрана — помечаем классом: тогда у неё прямые углы, иначе в скруглениях видны строки под ней.
  useEffect(() => {
    const bar = barRef.current;
    const onScroll = () => bar.classList.toggle('is-stuck', bar.getBoundingClientRect().top <= 0);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Текущая буква следит за прокруткой; раз в кадр, чтобы не пересчитывать на каждое событие.
  useEffect(() => {
    if (!letters.length) return undefined;
    let frame = 0;
    const update = () => {
      frame = 0;
      setActiveLetter(currentLetter(listRef.current, barRef.current.getBoundingClientRect().bottom) ?? letters[0]);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [letters]);

  // Прыжок к букве: её первая песня встаёт сразу под шапкой (уже закреплённой) и заголовком-буквой.
  const jump = (letter) => {
    const heading = listRef.current?.querySelector(`[data-letter="${CSS.escape(letter)}"]`);
    const first = heading?.nextElementSibling;
    if (!first) return;
    const top = first.getBoundingClientRect().top + window.scrollY - barRef.current.offsetHeight - heading.offsetHeight;
    window.scrollTo({ top: Math.ceil(top), behavior: 'instant' });
    setActiveLetter(letter);
  };

  const exact = songs.find((s) => String(s.num) === term);
  // Без поиска в карточке — первая песня списка, при поиске — самая подходящая.
  const first = term ? matched[0] : groups[0]?.songs[0];
  const preview = matched.find((s) => s.id === picked?.id) || exact || first || songs[0];
  // Вариант в превью: выбранный в карточке или тот, где нашлась строка.
  const previewVariant = picked && picked.id === preview?.id ? picked.variant : foundLines.get(preview?.id)?.variant ?? null;
  const { song: previewSong } = useSong(preview?.id ?? null);

  // Пока грузится следующая песня, карточка показывает предыдущую, а не пропадает.
  const [shown, setShown] = useState(null);
  if (previewSong && previewSong !== shown) setShown(previewSong);

  // Список готов, когда сборник загружен и, если ищем словами, пришёл ответ сервера.
  const ready = songs.length > 0 && (!term || isNum || (found && searchedTerm === term));
  useEffect(() => {
    if (!ready || restoreY.current == null) return;
    const y = restoreY.current;
    restoreY.current = null;
    // После кадра: при смене страницы общий макет сначала прокручивает её наверх.
    requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'instant' }));
  }, [ready]);

  // Уходя на страницу песни, запоминаем место в списке.
  const remember = () => save({ q, sort });

  // Новый поиск сбрасывает выбранную песню, очистка строки — нет: выбранная остаётся в карточке.
  const search = (value) => {
    setQ(value);
    if (value.trim()) setPicked(null);
  };

  return (
    <div className="page-enter container page-bg" style={{ '--title-chars': t('Сборник песен').length, '--sb-bar-h': barHeight ? `${barHeight}px` : undefined }}>
      <h1 className="page-title page-title--bg">Сборник песен</h1>

      <div className="songs-layout">
        {/* Поиск и список — один и тот же блок для телефона и десктопа:
            поиск закрепляется при прокрутке, рядом — сортировка. На десктопе справа — превью песни. */}
        <div>
          <div className="sb-bar" ref={barRef}>
            <div className="sb-bar-row">
              <label className="sb-search">
                <span className="sb-search-icon"><SearchIcon size={22} /></span>
                <input value={q} onChange={(e) => search(e.target.value)} placeholder={t('Название, строка или номер')} />
                {q && (
                  <button type="button" className="sb-clear" onClick={() => search('')} aria-label={t('Очистить')}>
                    <CloseIcon size={18} />
                  </button>
                )}
              </label>
              <button
                type="button"
                className={`sb-sort${sort === 'num' ? ' is-num' : ''}`}
                onClick={() => setSort(sort === 'num' ? 'alpha' : 'num')}
                aria-label={t('Сортировка')}
              >
                {sort === 'num' ? '1—9' : t('А—Я')}
              </button>
            </div>
            {letters.length > 1 && <LetterBar letters={letters} active={activeLetter} onJump={jump} />}
          </div>

          <div className="sb-list" ref={listRef}>
            {groups.map((group) => (
              <section key={group.letter ?? 'all'}>
                {group.letter && (
                  <div className="sb-letter" data-letter={group.letter}>
                    <span>{group.letter}</span>
                  </div>
                )}
                {group.songs.map((song) => (
                  <SongRow key={song.id} song={song} line={foundLines.get(song.id)?.line ?? song.line}
                    variant={foundLines.get(song.id)?.variant} words={words} isNum={isNum}
                    active={song.id === preview?.id} onPick={setPicked} onOpen={remember} />
                ))}
              </section>
            ))}
            {/* Пока сборник грузится — серые строки; не загрузился — сообщение с «Повторить». */}
            {loading && !error && songs.length === 0 && <SongListSkeleton />}
            {error && <LoadStatus error={error} onRetry={retry} />}
            {!loading && !error && matched.length === 0 && (
              <div className="sb-empty">
                <span className="sb-empty-title">Ничего не нашлось</span>
                <span>Попробуйте номер песни или слово из первой строки.</span>
              </div>
            )}
          </div>
        </div>

        <div className="desktop-only sb-preview">
          {!shown && !error && <SongCardSkeleton />}
          {shown && (
            <SongCard
              song={shown}
              variant={shown.id === preview?.id ? previewVariant : null}
              onVariant={(variant) => setPicked({ id: shown.id, variant })}
              nav={<Link to={`/songs/${shown.id}${shown.id === preview?.id && previewVariant ? `?v=${encodeURIComponent(previewVariant)}` : ''}`}
                className="song-card-back" onClick={remember}>Открыть песню ↗</Link>}
            />
          )}
        </div>
      </div>
    </div>
  );
}
