import './ChurchBrand.css';

// Логотип 9b (resources/poklonnaya-logo-dev/logo): вместо точки после «церковь» — голубой уголок.
// На en и ky текст переводит translatePage(); уголок не переводится.
export default function ChurchBrand() {
  return (
    <span className="church-brand">
      <span className="church-brand-word">
        церковь<span className="church-brand-corner" aria-hidden="true" />
      </span>
      <span className="church-brand-side">
        <span className="church-brand-name">на поклонной горе</span>
        <span className="church-brand-city">Санкт-Петербург</span>
      </span>
    </span>
  );
}
