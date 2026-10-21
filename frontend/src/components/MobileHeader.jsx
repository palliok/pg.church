import { Link } from 'react-router-dom';
import { getLang, langPath } from '../i18n.js';
import ChurchBrand from './ChurchBrand.jsx';

// Шапка телефона на всех страницах (resources/Mobile Header.html): логотип ведёт на главную, справа — языки.
// На десктопе вместо неё Header.
export default function MobileHeader() {
  return (
    <div className="mobile-only">
      <div className="mobile-header">
        <Link to="/" className="mobile-header-brand" aria-label="На главную">
          <ChurchBrand />
        </Link>

        <div className="mobile-header-lang">
          {['RU', 'EN', 'KY'].map((lng) => {
            const code = lng.toLowerCase();

            return (
              <button
                key={lng}
                type="button"
                className={getLang() === code ? 'active' : ''}
                onClick={() => { window.location.href = langPath(code); }}
              >
                {lng}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
