import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { GameTypeGate } from './GameTypeGate.jsx';
import { CreateGame } from './routes/CreateGame/CreateGame.jsx';
import { Game } from './routes/Game/Game.jsx';
import { Github } from './routes/Github/Github.jsx';
import { Home } from './routes/Home/Home.jsx';
import { HowToPlay } from './routes/HowToPlay/HowToPlay.jsx';
import { Leaderboard } from './routes/Leaderboard/Leaderboard.jsx';
import { Rooms } from './routes/Rooms/Rooms.jsx';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GameTypeGate />}>
          <Route path="/" element={<Home />} />
          <Route path="/create-game" element={<CreateGame />} />
          <Route path="/game" element={<Navigate to="/create-game" replace />} />
          <Route path="/game/:lobbyId" element={<Game />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/how-to-play" element={<HowToPlay />} />
          <Route path="/github" element={<Github />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
