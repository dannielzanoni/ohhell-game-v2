import { GameView } from './GameView.jsx';
import { useGameController } from './useGameController.js';

export function Game() {
  const controller = useGameController();

  return <GameView controller={controller} />;
}
