import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout.jsx';
import { CreateGame } from './routes/CreateGame/CreateGame.jsx';
import { Game } from './routes/Game/Game.jsx';
import { Github } from './routes/Github/Github.jsx';
import { Home } from './routes/Home/Home.jsx';
import { HowToPlay } from './routes/HowToPlay/HowToPlay.jsx';
import { Leaderboard } from './routes/Leaderboard/Leaderboard.jsx';
import { Rooms } from './routes/Rooms/Rooms.jsx';
import { routePaths } from './routes/routeContract.js';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path={routePaths.home} element={<Home />} />
          <Route path={routePaths.createGame} element={<CreateGame />} />
          <Route path={routePaths.game} element={<Navigate to={routePaths.createGame} replace />} />
          <Route path={`${routePaths.game}/:lobbyId`} element={<Game />} />
          <Route path={routePaths.rooms} element={<Rooms />} />
          <Route path={routePaths.leaderboard} element={<Leaderboard />} />
          <Route path={routePaths.howToPlay} element={<HowToPlay />} />
          <Route path={routePaths.github} element={<Github />} />
        </Route>
        <Route path="*" element={<Navigate to={routePaths.home} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
