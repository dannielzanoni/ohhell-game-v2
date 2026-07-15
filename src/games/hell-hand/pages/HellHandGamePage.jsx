import { GameSessionPage } from '@/games/session/GameSessionPage.jsx';
import { GAME_TYPES } from '@/games/core/model/gameTypes.js';
import { HELL_HAND_PATHS } from '@/games/hell-hand/paths.js';

export function HellHandGamePage() {
  return (
    <GameSessionPage
      createGamePath={HELL_HAND_PATHS.CREATE_GAME}
      initialGameType={GAME_TYPES.HELL_HAND}
      roomsPath={HELL_HAND_PATHS.ROOMS}
    />
  );
}
