import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { transposeChord } from '../chords.js';
import { t } from '../i18n.js';
import { DarkModeIcon, LightModeIcon } from './Icons.jsx';
import './SongSettings.css';

// Шкала тональности: от −5 до +6 полутонов, 0 — исходная.
const STEPS = Array.from({ length: 12 }, (_, i) => i - 5);

function Toggle({ label, on, onChange }) {
  return (
    <button type="button" className="ss-toggle" role="switch" aria-checked={on} onClick={() => onChange(!on)}>
      <span>{label}</span>
      <span className={`ss-switch${on ? ' is-on' : ''}`}><span /></span>
    </button>
  );
}

// Шторка настроек песни (resources/design_handoff_songbook_mobile, экран 04): тема карточки, аккорды,
// тональность и «Не гасить экран». В body — поверх нижнего меню; тап по затемнению или Esc закрывает.
export default function SongSettings({ dark, onDark, hasChords, chords, onChords, songKey, steps, onSteps, wake, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const stepLabel = (step) => (songKey ? transposeChord(songKey, step, songKey) : step > 0 ? `+${step}` : String(step));

  return createPortal(
    <div className="ss">
      <div className="ss-overlay" onClick={onClose} />
      <div className="ss-sheet" role="dialog" aria-modal="true" aria-labelledby="ss-title">
        <span className="ss-handle" />
        <span id="ss-title" className="ss-title">Настройки</span>

        <div className="ss-seg">
          <button type="button" className={dark ? '' : 'is-on'} onClick={() => onDark(false)} aria-pressed={!dark}>
            <LightModeIcon size={20} /><span>Светлая</span>
          </button>
          <button type="button" className={dark ? 'is-on' : ''} onClick={() => onDark(true)} aria-pressed={dark}>
            <DarkModeIcon size={20} /><span>Тёмная</span>
          </button>
        </div>

        {hasChords && (
          <>
            <Toggle label={t('Показывать аккорды')} on={chords} onChange={onChords} />

            <div className="ss-key">
              <div className="ss-key-head">
                <span className="ss-mono">Тональность</span>
                {songKey && <span className="ss-mono ss-muted"><span>Исходная</span>&nbsp;{songKey}</span>}
              </div>
              <div className="ss-scale">
                {STEPS.map((step) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => onSteps(step)}
                    aria-label={stepLabel(step)}
                    aria-pressed={step === steps}
                  >
                    {step === steps
                      ? <span className="ss-current">{stepLabel(step)}</span>
                      : <span className={`ss-tick${step === 0 ? ' is-origin' : ''}`} />}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {wake.supported && <Toggle label={t('Не гасить экран')} on={wake.on} onChange={wake.setOn} />}

        <button type="button" className="ss-done" onClick={onClose}>Готово</button>
      </div>
    </div>,
    document.body,
  );
}
