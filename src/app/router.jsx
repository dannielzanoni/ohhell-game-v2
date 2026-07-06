import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CharacterProfile } from './routes/Characters/CharacterProfile.jsx';
import { Mercenaries } from './routes/Characters/Characters.jsx';
import { CreateGame } from './routes/CreateGame/CreateGame.jsx';
import { Game } from './routes/Game/Game.jsx';
import { Github } from './routes/Github/Github.jsx';
import { Home } from './routes/Home/Home.jsx';
import { HowToPlay } from './routes/HowToPlay/HowToPlay.jsx';
import { Leaderboard } from './routes/Leaderboard/Leaderboard.jsx';
import { Playground } from './routes/Playground/Playground.jsx';
import { Rooms } from './routes/Rooms/Rooms.jsx';
import { AppLayout } from '@/components/layout/AppLayout.jsx';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/create-game" element={<CreateGame />} />
          <Route path="/game" element={<Navigate to="/create-game" replace />} />
          <Route path="/game/:lobbyId" element={<Game />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/characters" element={<Mercenaries />} />
          <Route path="/mercenaries" element={<Mercenaries />} />
          <Route path="/mercenaries/Artemis" element={<CharacterProfile characterId="artemis" />} />
          <Route path="/mercenaries/Conjuruz" element={<CharacterProfile characterId="conjuruz" />} />
          <Route path="/mercenaries/Gambler" element={<CharacterProfile characterId="gambler" />} />
          <Route path="/Artemis" element={<Navigate to="/mercenaries/Artemis" replace />} />
          <Route path="/Conjuruz" element={<Navigate to="/mercenaries/Conjuruz" replace />} />
          <Route path="/Gambler" element={<Navigate to="/mercenaries/Gambler" replace />} />
          <Route path="/how-to-play" element={<HowToPlay />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="/github" element={<Github />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
