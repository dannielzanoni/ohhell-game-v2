// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { storage } from '@/infrastructure/storage/storageAdapter.js';
import { storageKeys } from '@/infrastructure/storage/storageKeys.js';
import {
  GAME_PREFERENCES_STORAGE_KEY,
  defaultGamePreferences,
  deckTypes,
  getGamePreferences,
  setGamePreferences,
  subscribeToGamePreferences,
} from './gamePreferencesService.js';

afterEach(() => {
  storage.removeItem(storageKeys.cardPreferences);
  vi.restoreAllMocks();
});

describe('gamePreferencesService synchronization', () => {
  it('notifies local subscribers through a normalized local event', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToGamePreferences(listener);

    setGamePreferences({ volume: 23 });

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ volume: 23 }),
    );
    unsubscribe();
  });

  it('notifies subscribers when another tab changes storage', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToGamePreferences(listener);

    storage.setJson(GAME_PREFERENCES_STORAGE_KEY, {
      ...defaultGamePreferences,
      deckType: deckTypes.FRENCH,
    });
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: GAME_PREFERENCES_STORAGE_KEY,
      }),
    );

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ deckType: deckTypes.FRENCH }),
    );
    unsubscribe();
  });

  it('does not emit loops for unchanged preferences or duplicate events', () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToGamePreferences(listener);

    setGamePreferences({ volume: getGamePreferences().volume });
    expect(listener).not.toHaveBeenCalled();

    setGamePreferences({ volume: 44 });
    expect(listener).toHaveBeenCalledOnce();

    window.dispatchEvent(
      new StorageEvent('storage', {
        key: GAME_PREFERENCES_STORAGE_KEY,
      }),
    );
    window.dispatchEvent(
      new CustomEvent('ohhell-game-preferences-changed', {
        detail: getGamePreferences(),
      }),
    );

    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
  });
});
