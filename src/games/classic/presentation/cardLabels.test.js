import { describe, expect, it } from 'vitest';
import {
  getClassicCardLabel,
  getClassicCardRankCode,
  getClassicSuitTranslationKey,
} from './cardLabels.js';

describe('Classic card labels', () => {
  it('formats the human-readable card label', () => {
    expect(getClassicCardLabel({ rank: 'One', suit: 'Swords' })).toBe('A de espada');
  });

  it('preserves a custom card name', () => {
    expect(getClassicCardLabel({ name: 'Coringa' })).toBe('Coringa');
  });

  it('exposes the protocol-friendly rank and translation key', () => {
    const card = { rank: 'One', suit: 'Cups' };

    expect(getClassicCardRankCode(card)).toBe('1');
    expect(getClassicSuitTranslationKey(card)).toBe('cups');
  });
});
