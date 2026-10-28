import { useEffect, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAnnouncements } from '../api/announcements.js';
import AnnouncementBoard from '../components/AnnouncementBoard.jsx';
import AnnouncementStories, { AnnouncementTile } from '../components/AnnouncementStories.jsx';
import LoadStatus from '../components/LoadStatus.jsx';
import { t } from '../i18n.js';
import useReadAnnouncements from '../components/useReadAnnouncements.js';
import useShareAnnouncement from '../components/useShareAnnouncement.js';
import './Announcements.css';

const PHONE = '(max-width: 860px)';

// Ширина телефона. Полноэкранные сторис — только на нём; десктопная доска со своими сторис — только шире,
// иначе её таймер отмечал бы прочитанным невидимое.
function useIsPhone() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(PHONE);
      query.addEventListener('change', onChange);
      return () => query.removeEventListener('change', onChange);
    },
    () => window.matchMedia(PHONE).matches,
  );
}

// Страница объявлений. На телефоне — плитки, нажатая открывает полноэкранные сторис с этого объявления;
// на десктопе — сторис слева и список справа (AnnouncementBoard). Прочитанным объявление становится, только если
// на него нажали сами (плитка, строка списка) или пришли по ссылке на него, а не когда сторис дошли до него сами.
// ?a=<id> — открытое объявление: на телефоне — открытые сторис, на десктопе — с него начинаются сторис слева.
export default function Announcements() {
  const { items, loading, error, retry } = useAnnouncements();
  const [params, setParams] = useSearchParams();
  const { readIds, markRead } = useReadAnnouncements();
  const { share, toast } = useShareAnnouncement();
  const isPhone = useIsPhone();
  const location = useLocation();
  const navigate = useNavigate();

  const [linkedId] = useState(() => params.get('a'));
  const isRead = (item) => readIds.includes(String(item.id));

  // Пришёл по ссылке на объявление (карточка на главной, «Поделиться») — его открыли сами.
  useEffect(() => {
    if (linkedId) markRead(linkedId);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const storyIndex = isPhone && params.get('a') ? items.findIndex((item) => String(item.id) === params.get('a')) : -1;

  // Открытие сторис — новая запись в истории: «Назад» на телефоне закрывает их, а не уводит со страницы.
  // Крестик тогда тоже возвращается назад; открытые по ссылке закрываются заменой адреса.
  const openStory = (item) => {
    markRead(String(item.id));
    setParams({ a: String(item.id) }, { state: { story: true } });
  };
  const showStory = (index) => setParams({ a: String(items[index].id) }, { replace: true, state: location.state });
  const closeStory = () => (location.state?.story ? navigate(-1) : setParams({ a: '' }, { replace: true }));

  // --title-chars — длина заголовка на текущем языке: по ней подбирается кегль фонового заголовка.
  return (
    <div className="page-enter container page-bg ann12-page" style={{ '--title-chars': t('Объявления').length }}>
      <h1 className="page-title page-title--bg">Объявления</h1>

      <div className="ann12-panel">
        {(loading || error) && <LoadStatus error={error} onRetry={retry} />}

        {!loading && !error && items.length === 0 && (
          <div className="ann-empty">
            <div className="h-display" style={{ fontSize: 22 }}>Объявлений пока нет</div>
          </div>
        )}

        {items.length > 0 && (
          isPhone ? (
            <div className="ann-tiles">
              {items.map((item) => (
                <AnnouncementTile key={item.id} item={item} read={isRead(item)} onOpen={() => openStory(item)} />
              ))}
            </div>
          ) : (
            <AnnouncementBoard items={items} initialId={linkedId} readIds={readIds} onRead={markRead} onShare={share} />
          )
        )}
      </div>

      {storyIndex >= 0 && (
        <AnnouncementStories
          items={items}
          index={storyIndex}
          onIndex={showStory}
          onClose={closeStory}
          onShare={share}
        />
      )}

      {/* В body, чтобы тост был виден и поверх сторис */}
      {toast && createPortal(<div className="ann-toast" role="status">{toast}</div>, document.body)}
    </div>
  );
}
