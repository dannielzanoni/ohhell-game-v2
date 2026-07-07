// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cardBackOptions, getCardBackSrc } from '@/assets/catalog/cardCatalog.js';
import { storage } from '@/infrastructure/storage/storageAdapter.js';
import { storageKeys } from '@/infrastructure/storage/storageKeys.js';
import {
  defaultGamePreferences,
  getGamePreferences,
  setGamePreferences,
} from './gamePreferencesService.js';

afterEach(() => {
  storage.removeItem(storageKeys.cardPreferences);
});

describe('gamePreferencesService card back', () => {
  it('returns invalid card-back values to the default preference', () => {
    setGamePreferences({ cardBack: 'back_card999' });

    expect(getGamePreferences().cardBack).toBe(defaultGamePreferences.cardBack);
  });

  it('uses the same card-back preference value for preview and game table assets', () => {
    const selected = cardBackOptions.at(-1);
    const preferences = setGamePreferences({ cardBack: selected.value });

    expect(preferences.cardBack).toBe(selected.value);
    expect(selected.image).toBe(getCardBackSrc(preferences.cardBack));
  });
});
