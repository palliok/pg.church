import { Routes, Route } from 'react-router-dom';
import AppLayout from './components/AppLayout.jsx';
import Home from './pages/Home.jsx';
import Schedule from './pages/Schedule.jsx';
import EventDetail from './pages/EventDetail.jsx';
import SermonDetail from './pages/SermonDetail.jsx';
import Songs from './pages/Songs.jsx';
import SongDetail from './pages/SongDetail.jsx';
import Media from './pages/Media.jsx';
import About from './pages/About.jsx';
import Donate from './pages/Donate.jsx';
import Story from './pages/Story.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/story/:slug" element={<Story />} />
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/schedule/:id" element={<EventDetail />} />
        <Route path="/schedule/:id/sermon" element={<SermonDetail />} />
        <Route path="/songs" element={<Songs />} />
        <Route path="/songs/:id" element={<SongDetail />} />
        <Route path="/media" element={<Media />} />
        <Route path="/about" element={<About />} />
        <Route path="/donate" element={<Donate />} />
      </Route>
    </Routes>
  );
}
