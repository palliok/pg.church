import './ChurchBrand.css';

// Знак ПГ-храм из resources/poklonnaya-logo-pg/svg: mark — основной, mark-small — для размеров меньше 40 px
// (крест толще, чтобы не пропадал). Какой показать, решает ChurchBrand.css.
const MARK = 'M-31.20 67.86L-5.70 54.60L-5.70 100.50L-14.50 100.50L-14.50 69.09L-22.40 73.20L-22.40 100.50L-31.20 100.50ZM5.70 54.60L31.20 67.86L31.20 77.78L14.50 69.09L14.50 100.50L5.70 100.50ZM-1.70 27H1.70V35.8H11.1V39.2H1.70V100.5H-1.70V39.2H-11.1V35.8H-1.70Z';
const MARK_SMALL = 'M-32.30 67.86L-6.80 54.60L-6.80 100.50L-15.60 100.50L-15.60 69.09L-23.50 73.20L-23.50 100.50L-32.30 100.50ZM6.80 54.60L32.30 67.86L32.30 77.78L15.60 69.09L15.60 100.50L6.80 100.50ZM-2.60 27H2.60V35.2H12.4V40.4H2.60V100.5H-2.60V40.4H-12.4V35.2H-2.60Z';

// Логотип: знак ПГ-храм, «церковь» и подпись справа. Голубого уголка больше нет.
// На en и ky текст переводит translatePage(); знак не переводится.
export default function ChurchBrand() {
  return (
    <span className="church-brand">
      <span className="church-brand-word">
        <svg className="church-brand-mark church-brand-mark--full" viewBox="-31.2 27 62.4 73.5" aria-hidden="true" focusable="false">
          <path d={MARK} fill="currentColor" />
        </svg>
        <svg className="church-brand-mark church-brand-mark--small" viewBox="-32.3 27 64.6 73.5" aria-hidden="true" focusable="false">
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
