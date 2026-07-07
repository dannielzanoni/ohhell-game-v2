export const GAME_PREFERENCES_STORAGE_KEY = 'ohhell_game_preferences';
export const GAME_PREFERENCES_CHANGED_EVENT = 'ohhell-game-preferences-changed';

export const deckTypes = {
  FRENCH: 'french',
  SPANISH: 'spanish',
  SPANISH_8BIT: 'spanish_8bit',
};

export const defaultGamePreferences = {
  cardBack: 'back_card',
  deckType: deckTypes.SPANISH,
  hellHandHomeMusicVolume: 10,
  volume: 70,
};

function canUseStorage() {
  return typeof window !== 'undefined' && window.localStorage;
}

function normalizeDeckType(deckType) {
  return Object.values(deckTypes).includes(deckType)
    ? deckType
    : defaultGamePreferences.deckType;
}

function normalizeCardBack(cardBack) {
  return typeof cardBack === 'string' && /^back_card\d*$/.test(cardBack)
    ? cardBack
    : defaultGamePreferences.cardBack;
}

function normalizeVolume(volume) {
  const parsedVolume = Number(volume);

  if (!Number.isFinite(parsedVolume)) {
    return defaultGamePreferences.volume;
  }

  return Math.max(0, Math.min(100, Math.trunc(parsedVolume)));
}

export function normalizeGamePreferences(preferences = {}) {
  return {
    cardBack: normalizeCardBack(preferences.cardBack),
    deckType: normalizeDeckType(preferences.deckType),
    hellHandHomeMusicVolume: normalizeVolume(preferences.hellHandHomeMusicVolume),
    volume: normalizeVolume(preferences.volume),
  };
}

export function getGamePreferences() {
  if (!canUseStorage()) {
    return defaultGamePreferences;
  }

  try {
    const storedPreferences = localStorage.getItem(GAME_PREFERENCES_STORAGE_KEY);

    if (!storedPreferences) {
      return defaultGamePreferences;
    }

    return normalizeGamePreferences(JSON.parse(storedPreferences));
  } catch {
    return defaultGamePreferences;
  }
}

export function setGamePreferences(nextPreferences) {
  const preferences = normalizeGamePreferences({
    ...getGamePreferences(),
    ...nextPreferences,
  });

  if (canUseStorage()) {
    try {
      localStorage.setItem(
        GAME_PREFERENCES_STORAGE_KEY,
        JSON.stringify(preferences),
      );
    } catch {
      // Keep runtime preferences usable even when storage is unavailable.
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(GAME_PREFERENCES_CHANGED_EVENT, {
        detail: preferences,
      }),
    );
  }

  return preferences;
}

export function subscribeToGamePreferences(listener) {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handlePreferencesChanged = (event) => {
    listener(event.detail || getGamePreferences());
  };

  const handleStorageChanged = (event) => {
    if (event.key === GAME_PREFERENCES_STORAGE_KEY) {
      listener(getGamePreferences());
    }
  };

  window.addEventListener(
    GAME_PREFERENCES_CHANGED_EVENT,
    handlePreferencesChanged,
  );
  window.addEventListener('storage', handleStorageChanged);

  return () => {
    window.removeEventListener(
      GAME_PREFERENCES_CHANGED_EVENT,
      handlePreferencesChanged,
    );
    window.removeEventListener('storage', handleStorageChanged);
  };
}
