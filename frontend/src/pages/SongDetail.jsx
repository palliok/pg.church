import { Link, useParams } from 'react-router-dom';
import LoadStatus from '../components/LoadStatus.jsx';
import SongCard from '../components/SongCard.jsx';
import { useSong } from '../api/songs.js';
import './SongDetail.css';

// Страница песни: карточка из SongCard, шапка и меню вокруг остаются светлыми.
export default function SongDetail() {
  const { id } = useParams();
  const { song, loading, error, retry } = useSong(id);

  if (loading || error) {
    return (
      <div className="page-enter container" style={{ padding: '40px 16px' }}>
        <LoadStatus error={error} onRetry={retry} />
      </div>
    );
  }

  if (!song) {
    return (
      <div className="page-enter container" style={{ padding: '40px 16px' }}>
        <p>Песня не найдена.</p>
        <Link to="/songs">← К сборнику</Link>
      </div>
    );
  }

  return (
    <div className="page-enter song-page">
      <SongCard song={song} nav={<Link to="/songs" className="song-card-back">← Сборник песен</Link>} />
    </div>
  );
}
