import { HowToPlayView } from './HowToPlayView.jsx';
import { useStaticRouteController } from '../useStaticRouteController.js';

export function HowToPlay() {
  const controller = useStaticRouteController();
  return <HowToPlayView controller={controller} />;
}
