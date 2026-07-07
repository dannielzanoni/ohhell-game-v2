import { SettingsView } from './SettingsView.jsx';
import { useSettingsController } from './useSettingsController.js';

export function Settings() {
  const controller = useSettingsController();
  return <SettingsView controller={controller} />;
}
