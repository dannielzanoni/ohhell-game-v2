import { HomeView } from './HomeView.jsx';
import { useStaticRouteController } from '../useStaticRouteController.js';

export function Home() {
  const controller = useStaticRouteController();
  return <HomeView controller={controller} />;
}
