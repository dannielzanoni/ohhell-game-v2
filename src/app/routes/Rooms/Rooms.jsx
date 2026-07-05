import { RoomsView } from './RoomsView.jsx';
import { useRoomsController } from './useRoomsController.js';

export function Rooms() {
  const controller = useRoomsController();

  return <RoomsView controller={controller} />;
}
