import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout.jsx';
import { Game } from './routes/Game/Game.jsx';
import { Github } from './routes/Github/Github.jsx';
import { Home } from './routes/Home/Home.jsx';
import { HowToPlay } from './routes/HowToPlay/HowToPlay.jsx';
import { Leaderboard } from './routes/Leaderboard/Leaderboard.jsx';
import { Rooms } from './routes/Rooms/Rooms.jsx';
import { ViewRooms } from './routes/ViewRooms/ViewRooms.jsx';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/game" element={<Game />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/view-rooms" element={<ViewRooms />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/how-to-play" element={<HowToPlay />} />
          <Route path="/github" element={<Github />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
