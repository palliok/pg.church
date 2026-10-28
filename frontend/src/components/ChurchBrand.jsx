import './ChurchBrand.css';

// Логотип по макету resources/Logo.html; на en и ky его переводит translatePage().
export default function ChurchBrand() {
  return (
    <span className="church-brand">
      <span className="church-brand-word">
        церковь<span className="church-brand-dot">.</span>
      </span>
      <span className="church-brand-side">
        <span className="church-brand-name">на поклонной горе</span>
        <span className="church-brand-city">Санкт-Петербург</span>
      </span>
    </span>
  );
}
