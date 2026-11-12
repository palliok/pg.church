import { Link, useParams, useSearchParams } from 'react-router-dom';
import LoadStatus from '../components/LoadStatus.jsx';
import { SongCardSkeleton } from '../components/Skeletons.jsx';
import SongCard from '../components/SongCard.jsx';
import { useSong } from '../api/songs.js';
import './SongDetail.css';

// Страница песни: карточка из SongCard, шапка и меню вокруг остаются светлыми.
// Вариант текста — в адресе (?v=б), чтобы ссылкой можно было поделиться; основной — без параметра.
export default function SongDetail() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const pickVariant = (letter) => setParams(letter ? { v: letter } : {}, { replace: true });
  const { song, loading, error, retry } = useSong(id);

  // Пока песня грузится — заготовка карточки на её месте.
  if (loading && !error) {
    return (
      <div className="page-enter song-page">
        <SongCardSkeleton />
      </div>
    );
  }

  if (error) {
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
      <SongCard song={song} variant={params.get('v')} onVariant={pickVariant}
        nav={<Link to="/songs" className="song-card-back">← Сборник песен</Link>} />
    </div>
  );
}
