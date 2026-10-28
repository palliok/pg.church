import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Scene from './Scene.jsx';

// История-«фильм»: полноэкранные кадры сменяются прокруткой. Сцена закреплена (sticky),
// прокрутка двигает время: кадр медленно наезжает, текст проявляется и уходит,
// следующий кадр проступает сквозь растр точек. Картины кадров — panel.img (широкая) и
// panel.imgV (вертикальная, для телефона); пока картины нет, рисуется векторная <Scene>.

// Высота одного кадра в прокрутке, в высотах экрана.
const SPAN = 1.6;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const pad = (n) => String(n).padStart(2, '0');

function Art({ frame }) {
  if (!frame.img) return <Scene id={frame.scene} />;
  return (
    <picture className="sf-pic">
      {frame.imgV && <source media="(orientation: portrait)" srcSet={frame.imgV} />}
      <img src={frame.img} alt="" draggable="false" />
    </picture>
  );
}

export default function StoryFilm({ story, others }) {
  const box = useRef(null);
  const stage = useRef(null);
  const navigate = useNavigate();
  const [active, setActive] = useState(0);

  // Обложка — нулевой кадр, дальше кадры истории.
  const frames = useMemo(
    () => [{ scene: story.cover, img: story.coverImg, imgV: story.coverImgV, cover: true }, ...story.panels],
    [story],
  );
  const n = frames.length;

  useEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    el.focus({ preventScroll: true });

    const scenes = stage.current.querySelectorAll('.sf-scene');
    let raf = 0;
    let last = -1;
    const tick = () => {
      raf = 0;
      const h = el.clientHeight;
      // f — «время» истории: 0 на обложке, n−1 на последнем кадре.
      const f = clamp(el.scrollTop / (h * SPAN), 0, n - 1);
      const reveals = [...scenes].map((s, j) => (j === 0 ? 1 : clamp((f - (j - 0.4)) / 0.4)));
      scenes.forEach((s, j) => {
        // Кадр проступает в последние 40% предыдущего; первый виден сразу.
        const reveal = reveals[j];
        // Текст: появляется, когда кадр открылся, и уходит до начала следующего растворения.
        // Обложка видна сразу, последний кадр не уходит.
        const text = Math.min(j === 0 ? 1 : clamp((f - (j - 0.12)) / 0.22), j === n - 1 ? 1 : clamp((j + 0.58 - f) / 0.14));
        s.style.setProperty('--reveal', reveal.toFixed(3));
        s.style.setProperty('--enter', (1 - reveal).toFixed(3));
        // Насколько уже проступил следующий кадр — для перехода «состаривания» (burn).
        s.style.setProperty('--leave', (reveals[j + 1] ?? 0).toFixed(3));
        s.style.setProperty('--zoom', clamp(f - j + 0.4, 0, 1.4).toFixed(3));
        s.style.setProperty('--text', text.toFixed(3));
        // Слои векторной сцены дрейфуют вместе с кадром.
        s.style.setProperty('--p', (j - f).toFixed(3));
        s.toggleAttribute('data-off', f < j - 0.4 || f > j + 1.05);
        s.toggleAttribute('data-full', reveal >= 1);
      });
      const cur = Math.min(n - 1, Math.round(f - 0.1));
      if (cur !== last) {
        last = cur;
        setActive(cur);
        stage.current.dataset.tone = frames[cur].tone ?? 'dark';
      }
      stage.current.style.setProperty('--progress', (f / (n - 1)).toFixed(4));
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const key = (e) => { if (e.key === 'Escape') navigate('/'); };
    el.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    window.addEventListener('keydown', key);
    tick();
    return () => {
      el.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
      window.removeEventListener('keydown', key);
      cancelAnimationFrame(raf);
      document.body.style.overflow = prevOverflow;
    };
  }, [frames, n, navigate]);

  // Переход к кадру из рельса глав.
  const go = (j) => {
    const el = box.current;
    el.scrollTo({ top: j * el.clientHeight * SPAN + (j ? 1 : 0), behavior: 'smooth' });
  };

  return (
    <div className="sf" ref={box} tabIndex={-1}>
      <div className="sf-track" style={{ height: `calc(${(n - 1) * SPAN * 100}svh + 100svh)` }}>
        <div className="sf-stage" ref={stage} data-tone="dark">
          {frames.map((fr, j) => (
            <section
              key={j}
              className={`sf-scene${fr.cover ? ' is-cover' : ''}`}
              data-tr={fr.tr ?? 'dots'}
              data-next={frames[j + 1]?.tr}
              data-tone={fr.tone}
              style={{ zIndex: j + 1, '--ox': fr.ox ?? '70%', '--oy': fr.oy ?? '50%', '--fx': fr.fx ?? '70%' }}
              aria-label={fr.cover ? story.title : fr.title}
            >
              <div className="sf-art"><Art frame={fr} /></div>
              {fr.cover ? (
                <>
                  <div className="sf-text sf-cover-text">
                    <span className="sf-kicker">{story.kicker}</span>
                    {story.titleImg
                      ? <img className="sf-title-img" src={story.titleImg} alt={story.title} />
                      : <h1 className="sf-title">{story.title}</h1>}
                    <p className="sf-lead">{story.lead}</p>
                  </div>
                  <span className="sf-hint" aria-hidden="true">Листайте вниз</span>
                </>
              ) : (
                <div className="sf-text">
                  <span className="sf-kicker">{pad(j)} · {fr.tag}</span>
                  <h2 className="sf-title">{fr.title}</h2>
                  <p className="sf-body">{fr.text}</p>
                  {fr.ref && <span className="sf-ref">{fr.ref}</span>}
                </div>
              )}
            </section>
          ))}

          <div className="sf-chrome">
            <Link to="/" className="sf-close" aria-label="Закрыть историю">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
            </Link>
            <span className="sf-count" aria-hidden="true">{pad(active)} / {pad(n - 1)}</span>
            <nav className="sf-rail" aria-label="Главы истории">
              {frames.map((fr, j) => (
                <button key={j} type="button" className={j === active ? 'is-on' : ''} onClick={() => go(j)} aria-current={j === active ? 'step' : undefined}>
                  <i />
                  <span>{fr.cover ? 'Начало' : fr.tag}</span>
                </button>
              ))}
            </nav>
            <i className="sf-bar" />
          </div>
        </div>
      </div>

      <footer className="sf-fin">
        <h3>Что дальше</h3>
        <div className="sf-fin-links">
          <Link to="/schedule" className="sf-fin-card">
            <small>Приходите</small>
            <b>Расписание встреч</b>
          </Link>
          <Link to="/about" className="sf-fin-card">
            <small>Знакомство</small>
            <b>О церкви</b>
          </Link>
          {others.map(([k, o]) => (
            <Link key={k} to={`/story/${k}`} className="sf-fin-card">
              <small>{o.kicker}</small>
              <b>{o.title}</b>
            </Link>
          ))}
        </div>
        <Link to="/" className="sf-fin-home">На главную</Link>
      </footer>
    </div>
  );
}
