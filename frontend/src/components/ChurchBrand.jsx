import './ChurchBrand.css';

// Знак ПГ-храм из resources/poklonnaya-logo-pg-b/svg (вариант Б — крест на 20% толще): mark — основной,
// mark-small — для размеров меньше 40 px (крест ещё толще, чтобы не пропадал). Какой показать, решает ChurchBrand.css.
const MARK = 'M-31.54 67.86L-6.04 54.60L-6.04 100.50L-14.84 100.50L-14.84 69.09L-22.74 73.20L-22.74 100.50L-31.54 100.50ZM6.04 54.60L31.54 67.86L31.54 77.78L14.84 69.09L14.84 100.50L6.04 100.50ZM-2.04 27H2.04V35.46H11.1V39.54H2.04V100.5H-2.04V39.54H-11.1V35.46H-2.04Z';
const MARK_SMALL = 'M-32.82 67.86L-7.32 54.60L-7.32 100.50L-16.12 100.50L-16.12 69.09L-24.02 73.20L-24.02 100.50L-32.82 100.50ZM7.32 54.60L32.82 67.86L32.82 77.78L16.12 69.09L16.12 100.50L7.32 100.50ZM-3.12 27H3.12V34.68H12.4V40.92H3.12V100.5H-3.12V40.92H-12.4V34.68H-3.12Z';

// Логотип: знак ПГ-храм, «церковь» и подпись справа. Голубого уголка больше нет.
// На en и ky текст переводит translatePage(); знак не переводится.
export default function ChurchBrand() {
  return (
    <span className="church-brand">
      <span className="church-brand-word">
        <svg className="church-brand-mark church-brand-mark--full" viewBox="-31.54 27 63.08 73.5" aria-hidden="true" focusable="false">
          <path d={MARK} fill="currentColor" />
        </svg>
        <svg className="church-brand-mark church-brand-mark--small" viewBox="-32.82 27 65.64 73.5" aria-hidden="true" focusable="false">
          <path d={MARK_SMALL} fill="currentColor" />
        </svg>
        церковь
      </span>
      <span className="church-brand-side">
        <span className="church-brand-name">на поклонной горе</span>
        <span className="church-brand-city">Санкт-Петербург</span>
      </span>
    </span>
  );
}
