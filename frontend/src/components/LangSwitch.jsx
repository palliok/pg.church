import { useEffect, useRef, useState } from 'react';
import { getLang, langPath } from '../i18n.js';

const LANGS = ['ru', 'en', 'ky'];

// Переключатель языка: в свёрнутом виде — только текущий язык. По нажатию остальные
// выезжают влево в той же «пилюле»; выбор перезагружает страницу на другом языке,
// поэтому кнопка снова свёрнута. Выезжающая часть лежит поверх соседей и не сдвигает шапку.
export default function LangSwitch() {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const current = getLang();
  const others = LANGS.filter((l) => l !== current);

  useEffect(() => {
    if (!open) return undefined;
    const away = (e) => { if (!root.current?.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', away);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', away);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div className={`lang-switch${open ? ' is-open' : ''}`} ref={root}>
      <div className="lang-switch-more" aria-hidden={!open}>
        {others.map((l) => (
          <button key={l} type="button" tabIndex={open ? 0 : -1} onClick={() => window.location.assign(langPath(l))}>
            {l.toUpperCase()}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="lang-switch-current"
        aria-expanded={open}
        aria-label={`Язык: ${current.toUpperCase()}. Выбрать другой`}
        onClick={() => setOpen((v) => !v)}
      >
        {current.toUpperCase()}
      </button>
    </div>
  );
}
