import { CreateGameView } from './CreateGameView.jsx';
import { useCreateGameController } from './useCreateGameController.js';

export function CreateGame() {
  const controller = useCreateGameController();

  return <CreateGameView controller={controller} />;
}
