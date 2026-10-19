import { useAnnouncements } from '../api/announcements.js';
import { AnnouncementCard, PastAnnouncement } from '../components/AnnouncementCards.jsx';
import LoadStatus from '../components/LoadStatus.jsx';

// Объявления: новые — карточками (на телефоне каруселью), прошедшие — раскрывающимся списком «Ранее».
export default function Announcements() {
  const { fresh, past, loading, error, retry } = useAnnouncements();
  const empty = !loading && !error && fresh.length === 0 && past.length === 0;

  return (
    <div className="page-enter container ann-page">
      <h1 className="h-display ann-page-title">Объявления</h1>

      {(loading || error) && <LoadStatus error={error} onRetry={retry} />}

      {empty && (
        <div style={{ marginTop: 30, padding: '56px 20px', borderRadius: 24, background: 'var(--c-panel)', textAlign: 'center' }}>
          <div className="h-display" style={{ fontSize: 22 }}>Объявлений пока нет</div>
        </div>
      )}

      {fresh.length > 0 && (
        <div className="ann-cards">
          {fresh.map((item) => <AnnouncementCard key={item.id} item={item} />)}
        </div>
      )}

      {past.length > 0 && (
        <>
          <h2 className="ann-past-heading">Ранее</h2>
          <div className="ann-past-list">
            {past.map((item) => <PastAnnouncement key={item.id} item={item} />)}
          </div>
        </>
      )}
    </div>
  );
}
