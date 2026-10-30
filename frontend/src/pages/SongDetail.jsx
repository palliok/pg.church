import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useParams } from 'react-router-dom';
import { SettingsIcon, ShareIcon, TextDecreaseIcon, TextIncreaseIcon } from '../components/Icons.jsx';
import LoadStatus from '../components/LoadStatus.jsx';
import SongSettings from '../components/SongSettings.jsx';
import SongText from '../components/SongText.jsx';
import { useSong } from '../api/songs.js';
import { songKey, transposeSections } from '../chords.js';
import useWakeLock from '../hooks/useWakeLock.js';
import { t } from '../i18n.js';
import './SongDetail.css';

const FONT_SIZES = [17, 19, 22, 26];

// Включённые аккорды и тёмная тема запоминаются в браузере: кто играет или читает в полутьме,
// тому они нужны в каждой песне.
const CHORDS_KEY = 'songs:chords';
const THEME_KEY = 'songs:theme';

// fallback — если в хранилище ничего нет: аккорды по умолчанию выключены, тема тёмная.
function readFlag(key, on, fallback = false) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : value === on;
  } catch {
    return fallback;
  }
}

function writeFlag(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Хранилище недоступно (приватный режим) — выбор действует до ухода со страницы.
  }
}

// «Поделиться» песней: системное меню, а где его нет — ссылка в буфер обмена.
// toast — подпись для всплывашки, пустая строка — скрыта.
function useShareSong() {
  const [toast, setToast] = useState('');
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const showToast = (text) => {
    clearTimeout(timer.current);
    setToast(text);
    timer.current = setTimeout(() => setToast(''), 2000);
  };

  const share = async (song) => {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title: `${song.num} · ${song.title}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      showToast(t('Ссылка скопирована'));
    } catch (shareError) {
      // Пользователь закрыл меню «Поделиться» — это не ошибка.
      if (shareError?.name !== 'AbortError') showToast(t('Не удалось скопировать ссылку'));
    }
  };

  return { share, toast };
}

// Страница песни (resources/design_handoff_songbook_mobile, экраны 03–05): карточка со светлой или тёмной темой,
// размер текста в плашке, остальное — в шторке настроек. Тема меняет только карточку, шапка и меню остаются светлыми.
export default function SongDetail() {
  const { id } = useParams();
  const { song, loading, error, retry } = useSong(id);
  const [fontStep, setFontStep] = useState(1);
  const [chords, setChords] = useState(() => readFlag(CHORDS_KEY, '1'));
  const [dark, setDark] = useState(() => readFlag(THEME_KEY, 'dark', true));
  const [sheetOpen, setSheetOpen] = useState(false);
  const wake = useWakeLock();
  const { share, toast } = useShareSong();
  // Сдвиг в полутонах; у другой песни он начинается заново.
  const [transpose, setTranspose] = useState({ id, steps: 0 });
  const steps = transpose.id === id ? transpose.steps : 0;

  const key = useMemo(() => (song ? songKey(song) : null), [song]);
  const sections = useMemo(() => (song && chords ? transposeSections(song.sections, steps, key) : song?.sections), [song, chords, steps, key]);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const changeChords = (on) => {
    writeFlag(CHORDS_KEY, on ? '1' : '0');
    setChords(on);
  };
  const changeTheme = (on) => {
    writeFlag(THEME_KEY, on ? 'dark' : 'light');
    setDark(on);
  };

  if (loading || error) {
    return (
      <div className="page-enter container" style={{ padding: '40px 16px' }}>
        <LoadStatus error={error} onRetry={retry} />
      </div>
    );
  }

  if (!song) {
    return (
      <div className="page-enter container" style={{ padding: '40px 16px' }}>
        <p>Песня не найдена.</p>
        <Link to="/songs">← К сборнику</Link>
      </div>
    );
  }

  const showChords = song.hasChords && chords;

  return (
    <div className="page-enter song-page">
      <article className={`song-card${dark ? ' is-dark' : ''}${showChords ? ' has-chords' : ''}`}>
        <div className="song-card-bar">
          <Link to="/songs" className="song-card-back">← Сборник песен</Link>
          <div className="song-card-tools">
            <div className="song-card-chip">
              <button type="button" onClick={() => setFontStep(fontStep - 1)} disabled={fontStep === 0} aria-label={t('Мельче')}>
                <TextDecreaseIcon size={20} />
              </button>
              <button type="button" onClick={() => setFontStep(fontStep + 1)} disabled={fontStep === FONT_SIZES.length - 1} aria-label={t('Крупнее')}>
                <TextIncreaseIcon size={22} />
              </button>
              <button
                type="button"
                className={`song-card-gear${showChords || steps ? ' is-active' : ''}`}
                onClick={() => setSheetOpen(true)}
                aria-label={t('Настройки')}
              >
                <SettingsIcon size={20} />
              </button>
            </div>
            <button type="button" className="song-card-chip song-card-share" onClick={() => share(song)} aria-label={t('Поделиться')}>
              <ShareIcon size={18} />
            </button>
          </div>
        </div>

        <div className="song-card-head">
          <span className="song-card-num">{song.num}</span>
          <h1>{song.title}</h1>
        </div>

        <div className="song-card-text">
          <SongText sections={sections} chords={showChords} fontSize={FONT_SIZES[fontStep]} gap={10} />
        </div>
      </article>

      {sheetOpen && (
        <SongSettings
          dark={dark}
          onDark={changeTheme}
          hasChords={song.hasChords}
          chords={chords}
          onChords={changeChords}
          songKey={key}
          steps={steps}
          onSteps={(next) => setTranspose({ id, steps: next })}
          wake={wake}
          onClose={closeSheet}
        />
      )}

      {toast && createPortal(<div className="song-toast" role="status">{toast}</div>, document.body)}
    </div>
  );
}
