import { t } from '../i18n.js';
import './Skeletons.css';

// Заготовки на время загрузки: серые карточки той же формы, что и настоящие, по ним проходит блик.
// Ширины полос разные, чтобы список не выглядел одинаковыми кирпичиками.
const WIDTHS = ['72%', '54%', '86%', '63%', '78%', '48%', '69%', '58%'];

function Loading({ className, children }) {
  return (
    <div className={className} role="status" aria-busy="true" aria-label={t('Загрузка')}>
      {children}
    </div>
  );
}

// Строки сборника: номер, название с первой строкой, тональность.
export function SongListSkeleton({ count = 8 }) {
  return (
    <Loading className="skel-songs">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skel-song">
          <span className="skel skel-song-num" />
          <span className="skel-song-text">
            <span className="skel skel-bar" style={{ width: WIDTHS[i % WIDTHS.length], height: 16 }} />
            <span className="skel skel-bar" style={{ width: WIDTHS[(i + 3) % WIDTHS.length], height: 11 }} />
          </span>
          <span className="skel skel-song-key" />
        </div>
      ))}
    </Loading>
  );
}

// Тема карточки песни, как её запомнила SongCard (ключ songs:theme); по умолчанию тёмная.
function songCardDark() {
  try {
    return localStorage.getItem('songs:theme') !== 'light';
  } catch {
    return true;
  }
}

// Карточка песни (превью в сборнике и страница песни): плашка с кнопками, номер с названием, варианты и блоки текста.
// В той же теме, что и карточка, чтобы при загрузке не мигало светлым.
export function SongCardSkeleton() {
  return (
    <Loading className={`skel-song-card${songCardDark() ? ' is-dark' : ''}`}>
      <div className="skel-row is-between">
        <span className="skel skel-bar" style={{ width: 120, height: 12 }} />
        <span className="skel skel-pill" style={{ width: 150, height: 44 }} />
      </div>
      <div className="skel-row">
        <span className="skel skel-bar" style={{ width: 64, height: 40 }} />
        <span className="skel skel-bar" style={{ width: '55%', height: 28 }} />
      </div>
      <div className="skel-row">
        <span className="skel skel-pill" style={{ width: 130, height: 36 }} />
        <span className="skel skel-pill" style={{ width: 96, height: 36 }} />
      </div>
      {[4, 4, 3].map((lines, block) => (
        <div key={block} className="skel-block">
          {Array.from({ length: lines }, (_, i) => (
            <span key={i} className="skel skel-bar" style={{ width: WIDTHS[(block * 4 + i) % WIDTHS.length], height: 15 }} />
          ))}
        </div>
      ))}
    </Loading>
  );
}

// Плитки объявлений на телефоне: пилюля, заголовок в две строки, дата справа и кнопка.
export function AnnouncementTilesSkeleton({ count = 5 }) {
  return (
    <Loading className="skel-tiles">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="skel skel-tile">
          <span className="skel-tile-text">
            <span className="skel-mark" style={{ width: 84, height: 20, borderRadius: 99 }} />
            <span className="skel-mark" style={{ width: WIDTHS[i % WIDTHS.length], height: 18 }} />
            <span className="skel-mark" style={{ width: WIDTHS[(i + 2) % WIDTHS.length], height: 18 }} />
          </span>
          <span className="skel-mark" style={{ width: 44, height: 50 }} />
          <span className="skel-mark" style={{ width: 28, height: 28, borderRadius: 99 }} />
        </div>
      ))}
    </Loading>
  );
}

// Доска объявлений на десктопе: большая карточка слева и список строк с плиткой даты справа.
export function AnnouncementBoardSkeleton({ count = 6 }) {
  return (
    <Loading className="skel-board">
      <div className="skel skel-story">
        <span className="skel-mark" style={{ width: 84, height: 26, borderRadius: 99 }} />
        <span className="skel-story-bottom">
          <span className="skel-mark" style={{ width: '70%', height: 52 }} />
          <span className="skel-mark" style={{ width: '45%', height: 52 }} />
          <span className="skel-mark" style={{ width: '55%', height: 16, marginTop: 10 }} />
          <span className="skel-mark" style={{ width: 220, height: 56, marginTop: 14, borderRadius: 99 }} />
        </span>
      </div>
      <div className="skel-list">
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="skel-ann-row">
            <span className="skel skel-ann-tile" />
            <span className="skel-song-text">
              <span className="skel skel-bar" style={{ width: WIDTHS[i % WIDTHS.length], height: 20 }} />
              <span className="skel skel-bar" style={{ width: WIDTHS[(i + 5) % WIDTHS.length], height: 11 }} />
            </span>
          </div>
        ))}
      </div>
    </Loading>
  );
}

// Полосы текста разной ширины: n строк высотой h.
function Lines({ n, h = 14, from = 0 }) {
  return Array.from({ length: n }, (_, i) => (
    <span key={i} className="skel skel-bar" style={{ width: WIDTHS[(from + i) % WIDTHS.length], height: h }} />
  ));
}

// Объявление на главной: тёмная карточка — «Важно», заголовок, дата и «Подробнее».
export function HomeAnnouncementSkeleton({ className = '' }) {
  return (
    <section className={`ann-home ${className}`}>
      <Loading className="skel skel-ann-home">
        <span className="skel-mark" style={{ width: 70, height: 24, borderRadius: 99 }} />
        <span className="skel-mark" style={{ width: '72%', height: 26 }} />
        <span className="skel-mark" style={{ width: '48%', height: 26 }} />
        <span className="skel-mark" style={{ width: 170, height: 30, marginTop: 6 }} />
        <span className="skel-mark" style={{ width: 150, height: 40, marginTop: 6, borderRadius: 99 }} />
      </Loading>
    </section>
  );
}

// Карусель событий на главной (телефон): карточки 270×310, как .home-carousel-card.
export function HomeCarouselSkeleton() {
  return (
    <Loading className="home-carousel hide-scrollbar">
      {[0, 1, 2].map((i) => (
        <span key={i} className="skel skel-carousel-card">
          <span className="skel-mark" style={{ width: 64, height: 56 }} />
          <span className="skel-mark" style={{ width: 90, height: 12 }} />
          <span className="skel-carousel-bottom">
            <span className="skel-mark" style={{ width: 80, height: 30 }} />
            <span className="skel-mark" style={{ width: WIDTHS[i], height: 22 }} />
            <span className="skel-mark" style={{ width: 120, height: 26, borderRadius: 99 }} />
          </span>
        </span>
      ))}
    </Loading>
  );
}

// Блок «Расписание» на главной (десктоп): тёмная карточка ближайшего события и строки следующих.
export function HomeScheduleSkeleton() {
  return (
    <Loading className="skel-home-sched">
      <span className="skel skel-next">
        <span className="skel-mark" style={{ width: '55%', height: 11 }} />
        <span className="skel-mark" style={{ width: '70%', height: 26, marginTop: 14 }} />
        <span className="skel-mark" style={{ width: 100, height: 32 }} />
        <span className="skel-mark" style={{ width: 140, height: 11, marginTop: 10 }} />
      </span>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className="skel-sched-item">
          <span className="skel skel-sched-date" />
          <span className="skel-song-text">
            <Lines n={1} h={17} from={i} />
            <span className="skel skel-bar" style={{ width: 60, height: 14 }} />
          </span>
        </span>
      ))}
    </Loading>
  );
}

// Лента расписания: дни с числом слева и одним-двумя событиями (название, время, плашки) — как .sched-feed.
export function ScheduleFeedSkeleton() {
  return (
    <Loading className="sched-feed-wrap">
      <div className="sched-feed">
        {[2, 1, 1, 2].map((count, day) => (
          <section key={day} className="sched-feed-day">
            <div className="sched-feed-date">
              <span className="skel skel-bar" style={{ width: 44, height: 38 }} />
              <span className="skel skel-bar" style={{ width: 28, height: 11 }} />
            </div>
            <div className="sched-feed-items">
              {Array.from({ length: count }, (_, i) => (
                <div key={i} className="skel-feed-event">
                  <Lines n={1} h={22} from={day + i} />
                  <span className="skel skel-bar" style={{ width: 110, height: 19 }} />
                  <span className="skel-row">
                    <span className="skel skel-pill" style={{ width: 90, height: 26 }} />
                    <span className="skel skel-pill" style={{ width: 120, height: 26 }} />
                  </span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </Loading>
  );
}

// Календарь месяца: сетка 7×5 клеток.
export function ScheduleMonthSkeleton() {
  return (
    <Loading className="skel-month">
      {Array.from({ length: 35 }, (_, i) => <span key={i} className="skel skel-month-cell" />)}
    </Loading>
  );
}

// Страница события: метки, крупный заголовок и текст; панель с датой, временем и кнопками —
// справа на десктопе и под заголовком на телефоне.
export function EventSkeleton() {
  return (
    <Loading className="skel-ev">
      <span className="skel skel-bar" style={{ width: 110, height: 12 }} />
      <div className="skel-ev-layout">
        <div className="skel-ev-head">
          <span className="skel-row">
            <span className="skel skel-pill" style={{ width: 110, height: 30 }} />
            <span className="skel skel-pill" style={{ width: 80, height: 30 }} />
          </span>
          <span className="skel skel-bar skel-ev-title" style={{ width: '85%' }} />
          <span className="skel skel-bar skel-ev-title" style={{ width: '55%' }} />
        </div>
        <div className="skel skel-ev-panel">
          <span className="skel-mark" style={{ width: 120, height: 64 }} />
          <span className="skel-mark" style={{ width: 160, height: 24 }} />
          <span className="skel-mark" style={{ width: '70%', height: 14 }} />
          <span className="skel-mark" style={{ width: '100%', height: 52, marginTop: 'auto', borderRadius: 99 }} />
        </div>
        <div className="skel-ev-body">
          <Lines n={5} h={16} />
        </div>
      </div>
    </Loading>
  );
}

// Страница проповеди: проповедник, тема, место Писания, вступление и пункты плана.
export function SermonSkeleton() {
  return (
    <Loading className="skel-sermon">
      <span className="skel skel-pill" style={{ width: 220, height: 44 }} />
      <span className="skel-row" style={{ marginTop: 8 }}>
        <span className="skel skel-pill" style={{ width: 58, height: 58 }} />
        <span className="skel-song-text" style={{ flex: 1 }}>
          <span className="skel skel-bar" style={{ width: 180, height: 17 }} />
          <span className="skel skel-bar" style={{ width: 130, height: 11 }} />
        </span>
      </span>
      <span className="skel skel-bar" style={{ width: '80%', height: 40, marginTop: 10 }} />
      <span className="skel skel-bar" style={{ width: '50%', height: 40 }} />
      <span className="skel skel-bar" style={{ width: 120, height: 28 }} />
      <Lines n={4} h={16} />
    </Loading>
  );
}

// Новости: карточки с обложкой, датой, заголовком и началом текста — в той же сетке .news-grid.
export function NewsSkeleton() {
  return (
    <Loading className="news-grid">
      {[0, 1, 2].map((i) => (
        <span key={i} className="skel-news">
          <span className="skel" style={{ height: 100, borderRadius: 14 }} />
          <span className="skel skel-bar" style={{ width: 90, height: 11 }} />
          <Lines n={2} h={18} from={i} />
          <Lines n={2} h={13} from={i + 3} />
        </span>
      ))}
    </Loading>
  );
}

// Блог: строки с заголовком, метками и маленькой обложкой.
export function BlogSkeleton() {
  return (
    <Loading className="skel-blog">
      {[0, 1, 2, 3].map((i) => (
        <span key={i} className="skel-blog-row">
          <span className="skel skel-bar" style={{ width: 24, height: 11 }} />
          <span className="skel-song-text" style={{ flex: 1 }}>
            <Lines n={1} h={17} from={i} />
            <span className="skel skel-pill" style={{ width: 70, height: 20 }} />
          </span>
          <span className="skel" style={{ width: 52, height: 40, borderRadius: 10 }} />
        </span>
      ))}
    </Loading>
  );
}

// Пожертвование: QR-код на тёмной сцене.
export function DonateQrSkeleton() {
  return (
    <Loading className="donate-qrs">
      <span className="skel skel-qr" />
    </Loading>
  );
}

// Пожертвование: реквизиты — две колонки подписей и значений на подложке, как .donate-details.
export function DonateDetailsSkeleton() {
  return (
    <Loading className="donate-details">
      {[0, 1].map((col) => (
        <div key={col} className="donate-details-col">
          {Array.from({ length: 4 }, (_, i) => (
            <span key={i} className="skel-field">
              <span className="skel skel-bar" style={{ width: 110, height: 11 }} />
              <span className="skel skel-bar" style={{ width: WIDTHS[(col * 4 + i) % WIDTHS.length], height: 18 }} />
            </span>
          ))}
        </div>
      ))}
    </Loading>
  );
}
