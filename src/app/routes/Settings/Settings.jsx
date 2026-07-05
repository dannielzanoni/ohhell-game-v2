import { SettingsView } from './SettingsView.jsx';
import { useStaticRouteController } from '../useStaticRouteController.js';

export function Settings() {
  const controller = useStaticRouteController();
  return <SettingsView controller={controller} />;
}
