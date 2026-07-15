import hellHandHomeTheme from '@/games/hell-hand/assets/sounds/home-theme.mp3';
import {
  getGamePreferences,
  subscribeToGamePreferences,
} from '@/features/settings/model/gamePreferences.js';

let homeThemeAudio = null;
let unsubscribePreferences = null;
let isWaitingForUnlock = false;

function removeUnlockListeners() {
  if (typeof window === 'undefined' || !isWaitingForUnlock) {
    return;
  }

  window.removeEventListener('pointerdown', startHellHandHomeTheme);
  window.removeEventListener('keydown', startHellHandHomeTheme);
  isWaitingForUnlock = false;
}

function addUnlockListeners() {
  if (typeof window === 'undefined' || isWaitingForUnlock) {
    return;
  }

  window.addEventListener('pointerdown', startHellHandHomeTheme);
  window.addEventListener('keydown', startHellHandHomeTheme);
  isWaitingForUnlock = true;
}

function getHomeThemeVolume() {
  return getGamePreferences().hellHandHomeMusicVolume / 100;
}

function ensureHomeThemeAudio() {
  if (homeThemeAudio) {
    return homeThemeAudio;
  }

  homeThemeAudio = new Audio(hellHandHomeTheme);
  homeThemeAudio.loop = true;
  homeThemeAudio.volume = getHomeThemeVolume();

  unsubscribePreferences = subscribeToGamePreferences((preferences) => {
    if (!homeThemeAudio) {
      return;
    }

    homeThemeAudio.volume = preferences.hellHandHomeMusicVolume / 100;

    if (homeThemeAudio.volume <= 0) {
      homeThemeAudio.pause();
      return;
    }

    homeThemeAudio
      .play()
      .then(removeUnlockListeners)
      .catch(addUnlockListeners);
  });

  return homeThemeAudio;
}

export function startHellHandHomeTheme() {
  const audio = ensureHomeThemeAudio();

  if (audio.volume <= 0) {
    return;
  }

  audio.play().then(removeUnlockListeners).catch(addUnlockListeners);
}

export function stopHellHandHomeTheme() {
  if (!homeThemeAudio) {
    return;
  }

  homeThemeAudio.pause();
  homeThemeAudio.currentTime = 0;
  removeUnlockListeners();

  if (unsubscribePreferences) {
    unsubscribePreferences();
    unsubscribePreferences = null;
  }

  homeThemeAudio = null;
}
