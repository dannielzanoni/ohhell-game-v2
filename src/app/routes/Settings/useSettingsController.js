import { useCallback, useEffect, useState } from 'react';
import {
  getGamePreferences,
  setGamePreferences,
  subscribeToGamePreferences,
} from '@/services/gamePreferencesService.js';

export function useSettingsController() {
  const [preferences, setPreferences] = useState(getGamePreferences);

  useEffect(() => subscribeToGamePreferences(setPreferences), []);

  const setVolume = useCallback((volume) => {
    setPreferences(setGamePreferences({ volume }));
  }, []);

  return {
    preferences,
    setVolume,
  };
}
