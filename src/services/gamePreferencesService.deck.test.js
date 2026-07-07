// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { storage } from '@/infrastructure/storage/storageAdapter.js';
import { storageKeys } from '@/infrastructure/storage/storageKeys.js';
import {
  deckTypes,
  getGamePreferences,
  setGamePreferences,
} from './gamePreferencesService.js';

afterEach(() => {
  storage.removeItem(storageKeys.cardPreferences);
});

describe('gamePreferencesService deck type', () => {
  it('persists deck changes as local appearance preferences only', () => {
    const nextPreferences = setGamePreferences({ deckType: deckTypes.FRENCH });

    expect(nextPreferences.deckType).toBe(deckTypes.FRENCH);
    expect(getGamePreferences().deckType).toBe(deckTypes.FRENCH);
    expect(storage.getJson(storageKeys.cardPreferences)).toEqual(
      expect.objectContaining({ deckType: deckTypes.FRENCH }),
    );
  });

  it('normalizes unsupported deck values back to Spanish', () => {
    setGamePreferences({ deckType: 'remote-controlled-deck' });

    expect(getGamePreferences().deckType).toBe(deckTypes.SPANISH);
  });
});
