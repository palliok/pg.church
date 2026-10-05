import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ArrowKnob from '../components/ArrowKnob.jsx';
import { songs } from '../data/mockData.js';

const FONT_SIZES = [16, 19, 23];
const FONT_LABELS = ['S', 'M', 'L'];

export default function SongDetail() {
  const { id } = useParams();
  const song = songs.find((s) => String(s.id) === id);
  const [fontStep, setFontStep] = useState(1);

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
        <Link to="/songs" className="pill-btn" style={{ padding: '0 20px 0 8px', height: 44, background: 'var(--c-panel)', color: '#0d0d0d' }}>
          <ArrowKnob size={30} bg="#fff" fg="#0d0d0d" symbol="←" />
          <span style={{ fontSize: 11.5 }}>Сборник</span>
        </Link>
        <div style={{ display: 'flex', gap: 3, padding: 4, borderRadius: 999, background: 'var(--c-panel)' }}>
          {FONT_LABELS.map((label, i) => (
            <button
              key={label}
              onClick={() => setFontStep(i)}
              className="pill-btn"
              style={{ padding: '8px 14px', fontSize: 11, background: fontStep === i ? '#0d0d0d' : 'transparent', color: fontStep === i ? '#fff' : '#0d0d0d' }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', alignItems: 'baseline', gap: 16 }}>
        <span style={{ fontFamily: 'var(--f-head)', fontWeight: 900, fontSize: 44, color: 'var(--c-gray-text-mute)' }}>{song.num}</span>
        <h1 className="h-display" style={{ fontSize: 'clamp(30px, 5vw, 44px)', textTransform: 'none' }}>{song.title}</h1>
      </div>
      <div style={{ font: '600 13px var(--f-body)', color: 'var(--c-gray-text)', marginTop: 6 }}>{song.sub}</div>

      <div style={{ marginTop: 30 }}>
        {song.lyrics.map((line, i) => {
          const isLabel = line.length < 20;
          return (
            <p
              key={i}
              style={{
                margin: '0 0 20px',
                whiteSpace: 'pre-line',
                fontFamily: isLabel ? 'var(--f-head)' : 'var(--f-body)',
                fontWeight: isLabel ? 700 : 500,
                fontSize: isLabel ? 11 : FONT_SIZES[fontStep],
                lineHeight: isLabel ? 1 : 1.75,
                letterSpacing: isLabel ? '.12em' : 'normal',
                textTransform: isLabel ? 'uppercase' : 'none',
                color: isLabel ? 'var(--c-gray-text-mute)' : '#1a1a1a',
              }}
            >
              {line}
            </p>
          );
        })}
      </div>
    </div>
  );
}
