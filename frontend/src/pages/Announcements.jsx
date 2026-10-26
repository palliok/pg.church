import { useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAnnouncements } from '../api/announcements.js';
import { AnnouncementCard } from '../components/AnnouncementCards.jsx';
import { AnnouncementRow } from '../components/AnnouncementRows.jsx';
import AnnouncementStories, { AnnouncementTile } from '../components/AnnouncementStories.jsx';
import LoadStatus from '../components/LoadStatus.jsx';
import { t } from '../i18n.js';
import useReadAnnouncements from '../components/useReadAnnouncements.js';
import useShareAnnouncement from '../components/useShareAnnouncement.js';
import './Announcements.css';

const PHONE = '(max-width: 860px)';

// Ширина телефона. Сторис показываются только на нём: на десктопе их таймер листал бы ?a у карточки справа.
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
// на десктопе — список строк слева, открытая карточка справа. Показанные помечаются прочитанными.
// ?a=<id> — открытое объявление: на телефоне — открытые сторис, на десктопе — карточка справа
// (без ?a или с пустым ?a= там открыто первое).
export default function Announcements() {
  const { items, loading, error, retry } = useAnnouncements();
  const [params, setParams] = useSearchParams();
  const { readIds, markRead } = useReadAnnouncements();
  const { share, toast } = useShareAnnouncement();
  const isPhone = useIsPhone();
  const location = useLocation();
  const navigate = useNavigate();

  const openId = params.has('a') ? params.get('a') : String(items[0]?.id ?? '');
  const active = items.find((item) => String(item.id) === openId) ?? items[0];
  const isRead = (item) => readIds.includes(String(item.id));
  const storyIndex = isPhone && params.get('a') ? items.findIndex((item) => String(item.id) === params.get('a')) : -1;

  const open = (item) => {
    markRead(openId, String(item.id));
    setParams({ a: String(item.id) }, { replace: true });
  };

  // Открытие сторис — новая запись в истории: «Назад» на телефоне закрывает их, а не уводит со страницы.
  // Крестик тогда тоже возвращается назад; открытые по ссылке закрываются заменой адреса.
  const openStory = (item) => setParams({ a: String(item.id) }, { state: { story: true } });
  const showStory = (index) => setParams({ a: String(items[index].id) }, { replace: true, state: location.state });
  const closeStory = () => (location.state?.story ? navigate(-1) : setParams({ a: '' }, { replace: true }));

  // --ann-chars — длина заголовка на текущем языке: по ней кегль подбирается на всю ширину.
  return (
    <div className="page-enter container ann12-page" style={{ '--ann-chars': t('Объявления').length }}>
      <h1 className="page-title ann12-title">Объявления</h1>

      <div className="ann12-panel">
        {(loading || error) && <LoadStatus error={error} onRetry={retry} />}

        {!loading && !error && items.length === 0 && (
          <div className="ann-empty">
            <div className="h-display" style={{ fontSize: 22 }}>Объявлений пока нет</div>
          </div>
        )}

        {active && (
          <>
            {/* Телефон: плитки, нажатие открывает сторис */}
            <div className="ann-tiles ann-mobile">
              {items.map((item) => (
                <AnnouncementTile key={item.id} item={item} read={isRead(item)} onOpen={() => openStory(item)} />
              ))}
            </div>

            {/* Десктоп: список слева, открытая карточка справа */}
            <div className="ann-split">
              <div className="ann12-list">
                {items.map((item) => (
                  <AnnouncementRow
                    key={item.id}
                    item={item}
                    read={isRead(item)}
                    active={item === active}
                    onOpen={() => item !== active && open(item)}
                  />
                ))}
              </div>
              <div className="ann-split-card">
                <AnnouncementCard item={active} onShare={share} className="is-large" />
              </div>
            </div>
          </>
        )}
      </div>

      {storyIndex >= 0 && (
        <AnnouncementStories
          items={items}
          index={storyIndex}
          onIndex={showStory}
          onClose={closeStory}
          onSeen={markRead}
          onShare={share}
        />
      )}

      {/* В body, чтобы тост был виден и поверх сторис */}
      {toast && createPortal(<div className="ann-toast" role="status">{toast}</div>, document.body)}
    </div>
  );
}
