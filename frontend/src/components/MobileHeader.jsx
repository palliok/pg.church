import { Link } from 'react-router-dom';
import ChurchBrand from './ChurchBrand.jsx';
import LangSwitcher from './LangSwitcher.jsx';

// Шапка телефона на всех страницах (resources/Mobile Header.html): логотип ведёт на главную, справа — языки.
// На десктопе вместо неё Header.
export default function MobileHeader() {
  return (
    <div className="mobile-only">
      <div className="mobile-header">
        <Link to="/" className="mobile-header-brand" aria-label="На главную">
          <ChurchBrand />
        </Link>

        <LangSwitcher />
      </div>
    </div>
  );
}
