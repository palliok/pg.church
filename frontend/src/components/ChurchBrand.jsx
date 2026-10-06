import { church } from '../data/mockData.js';
import './ChurchBrand.css';

export default function ChurchBrand() {
  return (
    <span className="church-brand">
      <span className="church-brand-name">
        <strong>Поклонная</strong>
        <span>гора</span>
      </span>
      <span className="church-brand-city">{church.city}</span>
    </span>
  );
}
