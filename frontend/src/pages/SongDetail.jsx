import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ArrowKnob from '../components/ArrowKnob.jsx';
import LoadStatus from '../components/LoadStatus.jsx';
import SongText from '../components/SongText.jsx';
import { useSong } from '../api/songs.js';
import { songKey, transposeChord, transposeSections } from '../chords.js';

const FONT_SIZES = [16, 19, 23];
const FONT_LABELS = ['S', 'M', 'L'];

// Включённые аккорды запоминаются в браузере: кто играет, тому они нужны в каждой песне.
const CHORDS_KEY = 'songs:chords';

function readChords() {
  try {
    return localStorage.getItem(CHORDS_KEY) === '1';
  } catch {
    return false;
  }
}

function writeChords(on) {
  try {
    localStorage.setItem(CHORDS_KEY, on ? '1' : '0');
  } catch {
    // Хранилище недоступно (приватный режим) — выбор действует до ухода со страницы.
  }
}

const panelBtn = (active) => ({ padding: '8px 14px', fontSize: 11, background: active ? '#231f20' : 'transparent', color: active ? '#fff' : '#231f20' });

export default function SongDetail() {
  const { id } = useParams();
  const { song, loading, error, retry } = useSong(id);
  const [fontStep, setFontStep] = useState(1);
  const [chords, setChords] = useState(readChords);
  // Сдвиг в полутонах; у другой песни он начинается заново.
  const [transpose, setTranspose] = useState({ id, steps: 0 });
  const steps = transpose.id === id ? transpose.steps : 0;

  const key = useMemo(() => (song ? songKey(song) : null), [song]);
  const sections = useMemo(() => (song && chords ? transposeSections(song.sections, steps, key) : song?.sections), [song, chords, steps, key]);

  const toggleChords = () => {
    writeChords(!chords);
    setChords(!chords);
  };
  const shiftBy = (delta) => setTranspose((prev) => ({ id, steps: ((prev.id === id ? prev.steps : 0) + delta) % 12 }));

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

  return (
    <div className="page-enter container" style={{ padding: '20px 16px 64px', maxWidth: 760 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/songs" className="pill-btn" style={{ padding: '0 20px 0 8px', height: 44, background: 'var(--c-panel)', color: '#231f20' }}>
          <ArrowKnob size={30} bg="#fff" fg="#231f20" symbol="←" />
          <span style={{ fontSize: 11.5 }}>Сборник</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {song.hasChords && (
            <button
              onClick={toggleChords}
              aria-pressed={chords}
              className="pill-btn"
              style={{ padding: '0 18px', height: 44, fontSize: 11, background: chords ? '#231f20' : 'var(--c-panel)', color: chords ? '#fff' : '#231f20' }}
            >
              Аккорды
            </button>
          )}
          {song.hasChords && chords && (
            <div style={{ display: 'flex', gap: 3, padding: 4, borderRadius: 999, background: 'var(--c-panel)' }}>
              <button onClick={() => shiftBy(-1)} aria-label="На полтона ниже" className="pill-btn" style={{ ...panelBtn(false), fontSize: 17, padding: '4px 13px' }}>−</button>
              <button
                onClick={() => setTranspose({ id, steps: 0 })}
                disabled={!steps}
                aria-label="Исходная тональность"
                className="pill-btn"
                style={{ ...panelBtn(steps !== 0), minWidth: 44, justifyContent: 'center', cursor: steps ? 'pointer' : 'default' }}
              >
                {key ? transposeChord(key, steps, key) : steps > 0 ? `+${steps}` : steps}
              </button>
              <button onClick={() => shiftBy(1)} aria-label="На полтона выше" className="pill-btn" style={{ ...panelBtn(false), fontSize: 17, padding: '4px 13px' }}>+</button>
            </div>
          )}
          <div style={{ display: 'flex', gap: 3, padding: 4, borderRadius: 999, background: 'var(--c-panel)' }}>
            {FONT_LABELS.map((label, i) => (
              <button
                key={label}
                onClick={() => setFontStep(i)}
                className="pill-btn"
                style={panelBtn(fontStep === i)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', alignItems: 'baseline', gap: 16 }}>
        <span style={{ fontFamily: 'var(--f-sans)', fontWeight: 700, fontSize: 44, color: 'var(--c-gray-text-mute)' }}>{song.num}</span>
        <h1 className="h-display" style={{ fontSize: 'clamp(30px, 5vw, 44px)', textTransform: 'none' }}>{song.title}</h1>
      </div>
      <div style={{ font: '600 13px var(--f-sans)', color: 'var(--c-gray-text)', marginTop: 6 }}>{song.sub}</div>

      <div style={{ marginTop: 30 }}>
        <SongText sections={sections} chords={chords} fontSize={FONT_SIZES[fontStep]} />
      </div>
    </div>
  );
}
