import { SettingsView } from './SettingsView.jsx';
import { useNavigate } from 'react-router-dom';

export function Settings() {
  const navigate = useNavigate();
  const controller = {
    goBack: () => navigate(-1),
  };

  return <SettingsView controller={controller} />;
}
