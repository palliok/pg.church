import { useEffect, useRef } from 'react';

// Горизонтальная лента, которую листают пальцем (годы истории, главы справочника).
// Помечает края, за которыми есть ещё пункты (data-more-start / data-more-end — по ним затухают края).
// При первом появлении на экране лента слегка «подталкивается», чтобы было видно, что она листается.
export default function useRibbon() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    // Пользователь уже трогал ленту — подталкивать не нужно, иначе собьём его выбор.
    let touched = false;
    const touch = () => { touched = true; };

    const edges = () => {
      const max = el.scrollWidth - el.clientWidth;
      const start = el.scrollLeft > 4;
      const end = el.scrollLeft < max - 4;
      el.toggleAttribute('data-more-start', start);
      el.toggleAttribute('data-more-end', end);
    };

    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const fits = el.scrollWidth <= el.clientWidth + 4;
      if (fits || touched || el.scrollLeft > 4 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      // data-nudging — чтобы автопрокрутка не приняла это движение за действие человека.
      el.setAttribute('data-nudging', '');
      el.scrollTo({ left: 56, behavior: 'smooth' });
      setTimeout(() => el.scrollTo({ left: 0, behavior: 'smooth' }), 650);
      setTimeout(() => el.removeAttribute('data-nudging'), 1400);
    }, { threshold: 0.9 });

    el.addEventListener('scroll', edges, { passive: true });
    el.addEventListener('pointerdown', touch);
    el.addEventListener('click', touch);
    el.addEventListener('focusin', touch);
    window.addEventListener('resize', edges);
    io.observe(el);
    edges();
    return () => {
      el.removeEventListener('scroll', edges);
      el.removeEventListener('pointerdown', touch);
      el.removeEventListener('click', touch);
      el.removeEventListener('focusin', touch);
      window.removeEventListener('resize', edges);
      io.disconnect();
    };
  }, []);

  return { ref };
}
