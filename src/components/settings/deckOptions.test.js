import { describe, expect, it } from 'vitest';
import { deckTypes } from '@/services/gamePreferencesService.js';
import { deckOptions } from './deckOptions.js';

describe('deckOptions', () => {
  it('offers Spanish, Spanish 8-bit and French decks with optimized local previews', () => {
    expect(deckOptions.map((option) => option.value)).toEqual([
      deckTypes.SPANISH,
      deckTypes.SPANISH_8BIT,
      deckTypes.FRENCH,
    ]);
    expect(deckOptions.map((option) => option.labelKey)).toEqual([
      'settings.spanish',
      'settings.spanish8Bit',
      'settings.french',
    ]);
    for (const option of deckOptions) {
      expect(option.image).toMatch(/\.(jpg|png)(\?|$)/);
    }
  });
});
