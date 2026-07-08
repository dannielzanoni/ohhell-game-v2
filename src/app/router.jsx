import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { CharacterProfile } from './routes/Characters/CharacterProfile.jsx';
import { Mercenaries } from './routes/Characters/Characters.jsx';
import { CreateGame } from './routes/CreateGame/CreateGame.jsx';
import { Game } from './routes/Game/Game.jsx';
import { GameModeSelect } from './routes/GameModeSelect.jsx';
import { HellHandGame } from './routes/HellHand/HellHandGame.jsx';
import { Github } from './routes/Github/Github.jsx';
import { HellHandHome } from './routes/HellHand/HellHandHome.jsx';
import { HellHandRooms } from './routes/HellHand/HellHandRooms.jsx';
import { Home } from './routes/Home/Home.jsx';
import { HowToPlay } from './routes/HowToPlay/HowToPlay.jsx';
import { Leaderboard } from './routes/Leaderboard/Leaderboard.jsx';
import { Playground } from './routes/Playground/Playground.jsx';
import { PowerDecks } from './routes/PowerDecks/PowerDecks.jsx';
import { Rooms } from './routes/Rooms/Rooms.jsx';
import { Settings } from './routes/Settings/Settings.jsx';
import { AppLayout } from '@/components/layout/AppLayout.jsx';

function CharacterProfileRoute() {
  const { mercenaryId } = useParams();

  return <CharacterProfile characterId={mercenaryId} />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<GameModeSelect />} />
        <Route path="/hell-hand" element={<HellHandHome />} />
        <Route path="/hell-hand/game" element={<HellHandGame />} />
        <Route path="/hell-hand/rooms" element={<HellHandRooms />} />
        <Route path="/hell-hand/mercenaries" element={<Mercenaries />} />
        <Route path="/hell-hand/mercenaries/Artemis" element={<CharacterProfile characterId="artemis" />} />
        <Route path="/hell-hand/mercenaries/Conjuruz" element={<CharacterProfile characterId="conjuruz" />} />
        <Route path="/hell-hand/mercenaries/Gambler" element={<CharacterProfile characterId="gambler" />} />
        <Route path="/hell-hand/mercenaries/Leandro" element={<CharacterProfile characterId="leandro" />} />
        <Route element={<AppLayout />}>
          <Route path="/home" element={<Home />} />
          <Route path="/create-game" element={<CreateGame />} />
          <Route path="/game" element={<Navigate to="/create-game" replace />} />
          <Route path="/game/:lobbyId" element={<Game />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/characters" element={<Mercenaries />} />
          <Route path="/mercenaries" element={<Mercenaries />} />
          <Route path="/mercenaries/:mercenaryId" element={<CharacterProfileRoute />} />
          <Route path="/Artemis" element={<Navigate to="/mercenaries/Artemis" replace />} />
          <Route path="/Conjuruz" element={<Navigate to="/mercenaries/Conjuruz" replace />} />
          <Route path="/Gambler" element={<Navigate to="/mercenaries/Gambler" replace />} />
          <Route path="/Leandro" element={<Navigate to="/mercenaries/Leandro" replace />} />
          <Route path="/how-to-play" element={<HowToPlay />} />
          <Route path="/playground" element={<Playground />} />
          <Route path="/power-decks" element={<PowerDecks />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/github" element={<Github />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
