import { GameSessionPage } from '@/games/session/GameSessionPage.jsx';
import { GAME_TYPES } from '@/games/core/model/gameTypes.js';
import { CLASSIC_PATHS } from '@/games/classic/paths.js';

export function ClassicGamePage() {
  return (
    <GameSessionPage
      createGamePath={CLASSIC_PATHS.CREATE_GAME}
      initialGameType={GAME_TYPES.CLASSIC}
      roomsPath={CLASSIC_PATHS.ROOMS}
    />
  );
}
