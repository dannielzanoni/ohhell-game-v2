import { GithubView } from './GithubView.jsx';
import { useStaticRouteController } from '../useStaticRouteController.js';

export function Github() {
  const controller = useStaticRouteController();
  return <GithubView controller={controller} />;
}
