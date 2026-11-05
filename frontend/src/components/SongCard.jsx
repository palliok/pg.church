import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useHref } from 'react-router-dom';
import { songKey, transposeSections } from '../chords.js';
import useWakeLock from '../hooks/useWakeLock.js';
import { t } from '../i18n.js';
import { SettingsIcon, ShareIcon, TextDecreaseIcon, TextIncreaseIcon } from './Icons.jsx';
import SongSettings from './SongSettings.jsx';
import SongText from './SongText.jsx';
import './SongCard.css';

const FONT_SIZES = [17, 19, 22, 26];

// Песня, у которой не осталось ни одного варианта текста.
const NO_TEXT = { letter: '', key: null, capo: null, isDefault: true, hasChords: false, sections: [] };

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

  // url — полный адрес песни: карточка бывает и превью в сборнике, где адрес страницы другой.
  const share = async (song, url) => {

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

// Авторы варианта под текстом, как в бумажных сборниках: «Музыка», «Слова», «Исполнитель».
function SongCredits({ variant }) {
  const credits = [['Музыка', variant.composer], ['Слова', variant.lyricist], ['Исполнитель', variant.artist]].filter(([, name]) => name);

  if (credits.length === 0) return null;

  return (
    <dl className="song-card-credits">
      {credits.map(([role, name]) => (
        <div key={role}>
          <dt>{role}</dt>
          <dd>{name}</dd>
        </div>
      ))}
    </dl>
  );
}

// Карточка песни (resources/design_handoff_songbook_mobile, экраны 03–05): светлая или тёмная тема,
// размер текста в плашке, остальное — в шторке настроек. Тема меняет только карточку.
// Одна и та же на странице песни и в превью сборника на десктопе; nav — ссылка слева в плашке.
// variant — буква выбранного варианта текста (null — основной), onVariant получает новую.
export default function SongCard({ song, nav, variant, onVariant }) {
  const [fontStep, setFontStep] = useState(1);
  const [chords, setChords] = useState(() => readFlag(CHORDS_KEY, '1'));
  const [dark, setDark] = useState(() => readFlag(THEME_KEY, 'dark', true));
  const [sheetOpen, setSheetOpen] = useState(false);
  const wake = useWakeLock();
  const { share, toast } = useShareSong();
  const variants = song.variants;
  const current = variants.find((item) => item.letter === variant) ?? variants[0] ?? NO_TEXT;
  // Буква видна, только когда есть из чего выбирать: 214а, 214б.
  const letter = variants.length > 1 ? current.letter : '';
  const href = useHref(`/songs/${song.id}${current.isDefault || !letter ? '' : `?v=${encodeURIComponent(letter)}`}`);
  // Сдвиг в полутонах; у другой песни или другого варианта он начинается заново.
  const transposeId = `${song.id}:${current.letter}`;
  const [transpose, setTranspose] = useState({ id: transposeId, steps: 0 });
  const steps = transpose.id === transposeId ? transpose.steps : 0;

  const key = useMemo(() => songKey(current), [current]);
  const sections = useMemo(() => (chords ? transposeSections(current.sections, steps, key) : current.sections), [current, chords, steps, key]);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const changeChords = (on) => {
    writeFlag(CHORDS_KEY, on ? '1' : '0');
    setChords(on);
  };
  const changeTheme = (on) => {
    writeFlag(THEME_KEY, on ? 'dark' : 'light');
    setDark(on);
  };

  const showChords = current.hasChords && chords;

  return (
    <>
      <article className={`song-card${dark ? ' is-dark' : ''}${showChords ? ' has-chords' : ''}`}>
        <div className="song-card-bar">
          {nav}
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
            <button
              type="button"
              className="song-card-chip song-card-share"
              onClick={() => share({ ...song, num: `${song.num}${letter}` }, new URL(href, window.location.origin).href)}
              aria-label={t('Поделиться')}
            >
              <ShareIcon size={18} />
            </button>
          </div>
        </div>

        <div className="song-card-head">
          <span className="song-card-num">{song.num}{letter && <small>{letter}</small>}</span>
          <h1>{song.title}</h1>
        </div>

        {variants.length > 1 && (
          <div className="song-card-variants" role="group" aria-label={t('Варианты текста')}>
            {variants.map((item) => (
              <button
                key={item.letter}
                type="button"
                className={`song-card-variant${item === current ? ' is-active' : ''}`}
                aria-pressed={item === current}
                onClick={() => onVariant(item.isDefault ? null : item.letter)}
              >
                <span className="song-card-variant-letter">{song.num}{item.letter}</span>
                {item.label && <span>{item.label}</span>}
              </button>
            ))}
          </div>
        )}

        <div className="song-card-text">
          {showChords && current.capo > 0 && (
            <p className="song-card-capo"><span>Каподастр</span> {current.capo}</p>
          )}
          <SongText sections={sections} chords={showChords} fontSize={FONT_SIZES[fontStep]} gap={10} />
        </div>

        <SongCredits variant={current} />
      </article>

      {sheetOpen && (
        <SongSettings
          dark={dark}
          onDark={changeTheme}
          hasChords={current.hasChords}
          chords={chords}
          onChords={changeChords}
          songKey={key}
          steps={steps}
          onSteps={(next) => setTranspose({ id: transposeId, steps: next })}
          wake={wake}
          onClose={closeSheet}
        />
      )}

      {toast && createPortal(<div className="song-toast" role="status">{toast}</div>, document.body)}
    </>
  );
}
