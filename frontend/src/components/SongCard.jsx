import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useHref } from 'react-router-dom';
import { pitchOf, songKey, transposeChord, transposeSections } from '../chords.js';
import { t } from '../i18n.js';
import { ChordsIcon, ColumnsIcon, DarkModeIcon, LightModeIcon, ShareIcon, TextDecreaseIcon, TextIncreaseIcon } from './Icons.jsx';
import SongKeys from './SongKeys.jsx';
import SongText from './SongText.jsx';
import './SongCard.css';

const FONT_SIZES = [17, 19, 22, 26];

// Тональность — от −5 до +6 полутонов от исходной (все 12), каподастр — до 9-го лада.
const STEPS = Array.from({ length: 12 }, (_, i) => i - 5);
const CAPOS = Array.from({ length: 10 }, (_, i) => i);
const MAX_CAPO = 9;

// Песня, у которой не осталось ни одного варианта текста.
const NO_TEXT = { letter: '', key: null, capo: null, tempo: null, time: null, isDefault: true, hasChords: false, sections: [] };

// Включённые аккорды, тёмная тема и две колонки запоминаются в браузере: кто играет или читает в полутьме,
// тому они нужны в каждой песне. Колонки — только на десктопе, на телефоне текст всегда в одну.
const CHORDS_KEY = 'songs:chords';
const THEME_KEY = 'songs:theme';
const COLUMNS_KEY = 'songs:columns';

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
// в плашке — размер текста, аккорды, тема и колонки (на десктопе). Тема меняет только карточку.
// Одна и та же на странице песни и в превью сборника на десктопе; nav — ссылка слева в плашке.
// variant — буква выбранного варианта текста (null — основной), onVariant получает новую.
export default function SongCard({ song, nav, variant, onVariant }) {
  const [fontStep, setFontStep] = useState(1);
  const [chords, setChords] = useState(() => readFlag(CHORDS_KEY, '1'));
  const [dark, setDark] = useState(() => readFlag(THEME_KEY, 'dark', true));
  const [twoColumns, setTwoColumns] = useState(() => readFlag(COLUMNS_KEY, '2'));
  const { share, toast } = useShareSong();
  const variants = song.variants;
  const current = variants.find((item) => item.letter === variant) ?? variants[0] ?? NO_TEXT;
  // Буква видна, только когда есть из чего выбирать: 214а, 214б.
  const letter = variants.length > 1 ? current.letter : '';
  const href = useHref(`/songs/${song.id}${current.isDefault || !letter ? '' : `?v=${encodeURIComponent(letter)}`}`);
  // Сдвиг звучания в полутонах и лад каподастра; у другой песни или другого варианта они начинаются заново.
  // Аккорды в тексте записаны под каподастр варианта (songCapo): звучат на songCapo полутонов выше.
  // Свой каподастр сдвигает аппликатуру в обратную сторону, звучание остаётся прежним.
  // Выбор тональности снимает каподастр (как на holychord): аккорды сразу в выбранной тональности, без пересчёта.
  const transposeId = `${song.id}:${current.letter}`;
  const songCapo = Math.min(Math.max(current.capo ?? 0, 0), MAX_CAPO);
  const [transpose, setTranspose] = useState({ id: transposeId, steps: 0, capo: songCapo });
  const { steps, capo } = transpose.id === transposeId ? transpose : { steps: 0, capo: songCapo };
  const shapeSteps = steps - (capo - songCapo);
  const changeTranspose = (change) => setTranspose((prev) => ({ steps, capo, ...(prev.id === transposeId ? prev : {}), ...change, id: transposeId }));

  const key = useMemo(() => songKey(current), [current]);
  const sections = useMemo(() => (chords ? transposeSections(current.sections, shapeSteps, key) : current.sections), [current, chords, shapeSteps, key]);
  // Тональность со сдвигом на n полутонов от записанной; без тональности — просто «+2».
  const keyName = (n, step) => (key ? transposeChord(key, n, key) : step > 0 ? `+${step}` : String(step));
  // 12 тональностей — как звучит песня, с учётом каподастра варианта; по порядку от C.
  const origin = pitchOf(key);
  const keys = STEPS
    .map((step) => ({ step, label: keyName(songCapo + step, step), isOrigin: step === 0 }))
    .sort((a, b) => (origin === null ? a.step - b.step : ((origin + songCapo + a.step + 120) % 12) - ((origin + songCapo + b.step + 120) % 12)));
  // У лада — тональность, в которой с этим каподастром играть аккорды.
  const capos = CAPOS.map((fret) => ({ capo: fret, note: key ? keyName(songCapo + steps - fret) : '' }));

  const changeChords = (on) => {
    writeFlag(CHORDS_KEY, on ? '1' : '0');
    setChords(on);
  };
  const changeTheme = (on) => {
    writeFlag(THEME_KEY, on ? 'dark' : 'light');
    setDark(on);
  };
  const changeColumns = (on) => {
    writeFlag(COLUMNS_KEY, on ? '2' : '1');
    setTwoColumns(on);
  };

  const showChords = current.hasChords && chords;

  return (
    <>
      <article className={`song-card${dark ? ' is-dark' : ''}${showChords ? ' has-chords' : ''}${twoColumns ? ' is-two-columns' : ''}`}>
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
              {current.hasChords && (
                <button type="button" className="song-card-toggle" onClick={() => changeChords(!chords)} aria-pressed={chords} aria-label={t('Аккорды')}>
                  <ChordsIcon size={20} />
                </button>
              )}
              {/* Значок — тема, на которую переключит кнопка. */}
              <button type="button" onClick={() => changeTheme(!dark)} aria-label={dark ? t('Светлая тема') : t('Тёмная тема')}>
                {dark ? <LightModeIcon size={19} /> : <DarkModeIcon size={19} />}
              </button>
              <button
                type="button"
                className="song-card-toggle song-card-columns"
                onClick={() => changeColumns(!twoColumns)}
                aria-pressed={twoColumns}
                aria-label={t('Две колонки')}
              >
                <ColumnsIcon size={19} />
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

        {showChords && (
          <SongKeys
            keys={keys}
            steps={steps}
            onSteps={(next) => changeTranspose({ steps: next, capo: 0 })}
            capos={capos}
            capo={capo}
            onCapo={(next) => changeTranspose({ capo: next })}
            tempo={current.tempo}
            time={current.time}
          />
        )}

        <div className="song-card-text">
          <SongText sections={sections} chords={showChords} fontSize={FONT_SIZES[fontStep]} gap={10} />
        </div>

        <SongCredits variant={current} />
      </article>


      {toast && createPortal(<div className="song-toast" role="status">{toast}</div>, document.body)}
    </>
  );
}
