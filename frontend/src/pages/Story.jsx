import { useEffect, useRef } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import Scene from '../components/Scene.jsx';
import { stories } from '../data/stories.js';

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 18 18 6M8 6h10v10" />
  </svg>
);

export default function Story() {
  const { slug } = useParams();
  const st = stories[slug];
  const box = useRef(null);
  const bar = useRef(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    let raf = 0;
    const tick = () => {
      raf = 0;
      const h = el.clientHeight;
      el.querySelectorAll('.pn').forEach((n) => {
        const r = n.getBoundingClientRect();
        const p = Math.max(-1.3, Math.min(1.3, (r.top + r.height / 2 - h / 2) / h));
        n.style.setProperty('--p', p.toFixed(3));
        if (r.top < h * 0.85) n.classList.add('in');
      });
      if (bar.current) bar.current.style.transform = `scaleX(${el.scrollTop / Math.max(1, el.scrollHeight - h)})`;
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(tick); };
    el.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    tick();
    return () => {
      el.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
      cancelAnimationFrame(raf);
      document.body.style.overflow = prev;
    };
  }, [slug]);

  if (!st) return <Navigate to="/" replace />;
  const others = Object.entries(stories).filter(([k]) => k !== slug);

  return (
    <div className="st" ref={box} key={slug}>
      <div className="st-top">
        <Link to="/" className="st-x" aria-label="Закрыть">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </Link>
        <span className="st-name">{st.kicker}</span>
        <i className="st-bar" ref={bar} />
      </div>

      <div className="st-body">
        <section className="pn cover in">
          <Scene id={st.cover} />
          <div className="cv">
            <span className="tag">{st.kicker}</span>
            <h1>{st.title}</h1>
            <p>{st.lead}</p>
            <svg className="dn" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
          </div>
        </section>

        {st.panels.map((p, i) => (
          <section key={i} className={`pn ${i % 2 ? 'r' : 'l'}`}>
            <div className="pn-art">
              <Scene id={p.scene} />
              <span className="no">{i + 1}</span>
            </div>
            <div className="pn-cap">
              <small>{p.tag}</small>
              <h2>{p.title}</h2>
              <p>{p.text}</p>
            </div>
          </section>
        ))}

        <section className="fin">
          <h3>Читай дальше</h3>
          {others.map(([k, o]) => (
            <Link key={k} to={`/story/${k}`} className="fin-card" style={{ background: o.bg }}>
              <span>
                <small>{o.kicker}</small>
                <b>{o.title}</b>
              </span>
              <span className="fin-go"><Arrow /></span>
            </Link>
          ))}
          <Link to="/" className="fin-home">На главную</Link>
        </section>
      </div>
    </div>
  );
}
