import './ChurchBrand.css';

// Логотип по макету resources/design_handoff_logo_6a: точки нет, на её месте линия — петля и холм (Поклонная гора).
// На en и ky текст переводит translatePage(); линия не переводится.
export default function ChurchBrand() {
  return (
    <span className="church-brand">
      <span className="church-brand-word">церковь</span>
      <svg className="church-brand-line" viewBox="0 0 64 40" aria-hidden="true" focusable="false">
        <defs>
          <filter id="church-brand-brush" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="1" seed="0" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="2.5" />
          </filter>
        </defs>
        <path
          filter="url(#church-brand-brush)"
          d="M 2 36 C 10 20, 30 14, 30 26 C 30 38, 14 36, 18 26 C 23 14, 31 4, 37 4 C 45 4, 50 30, 58 36"
        />
      </svg>
      <span className="church-brand-side">
        <span className="church-brand-name">на поклонной горе</span>
        <span className="church-brand-city">Санкт-Петербург</span>
      </span>
    </span>
  );
}
