import { useEffect, useRef, useState } from 'react';

// Автопрокрутка блока (годы истории, главы справочника): каждые delay мс вызывает onTick,
// пока блок виден на экране. Пауза — только на настоящее действие в блоке: нажатие (выбор года,
// главы, стрелки), клавиши, листание ленты вбок или прокрутка текста в ридере. Наведение мыши
// и прокрутка самой страницы паузу не ставят. Через resume мс без действий прокрутка продолжается.
// При «уменьшить движение» в системе автопрокрутки нет.
// Возвращает ref для блока и running — идёт ли сейчас отсчёт (для кольца-таймера на кнопке).
export default function useAutoplay(onTick, { delay = 5000, resume = 8000 } = {}) {
  const ref = useRef(null);
  const [running, setRunning] = useState(false);
  const tick = useRef(onTick);
  // Свежий onTick (с текущим номером) — после каждого рендера.
  useEffect(() => { tick.current = onTick; });

  useEffect(() => {
    const el = ref.current;
    if (!el || matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;

    let visible = false;
    let pausedUntil = 0;
    let timer = 0;

    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const go = visible && !document.hidden && Date.now() >= pausedUntil;
        if (go) { ignoreUntil = Date.now() + 1200; tick.current(); }
        setRunning(go);
        schedule();
      }, delay);
    };
    const pause = () => { pausedUntil = Date.now() + resume; setRunning(false); schedule(); };
    // Пауза на прокрутку внутри блока — только настоящую: ленты годов/глав вбок
    // ([data-autoplay-hold]) или текста ридера ([data-autoplay-scroll]). Колесо или палец над
    // блоком, когда листают саму страницу, ничего внутри не двигает и паузу не ставит.
    // Свои прокрутки не считаются: центровка ленты после автошага (ignoreUntil) и «подталкивание»
    // ленты при первом показе (data-nudging).
    let ignoreUntil = 0;
    const innerScroll = (e) => {
      const t = e.target;
      if (!t.matches?.('[data-autoplay-hold], [data-autoplay-scroll]')) return;
      if (Date.now() < ignoreUntil || t.hasAttribute('data-nudging')) return;
      pause();
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      setRunning(visible && Date.now() >= pausedUntil);
      if (visible) schedule();
    }, { threshold: 0.3 });
    io.observe(el);
    el.addEventListener('click', pause);
    el.addEventListener('keydown', pause);
    el.addEventListener('scroll', innerScroll, { capture: true, passive: true });
    schedule();

    return () => {
      clearTimeout(timer);
      io.disconnect();
      el.removeEventListener('click', pause);
      el.removeEventListener('keydown', pause);
      el.removeEventListener('scroll', innerScroll, { capture: true });
    };
  }, [delay, resume]);

  return { ref, running };
}
