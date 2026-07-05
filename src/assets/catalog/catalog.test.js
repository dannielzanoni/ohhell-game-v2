import { describe, expect, it } from 'vitest';
import { avatars, findAvatar, resolveAvatarSrc } from './avatarCatalog.js';
import {
  cardRanks,
  cardSuits,
  defaultCardBack,
  getCardAssetKey,
  getCardBackSrc,
  getCardImageSrc,
  getCardLabel,
} from './cardCatalog.js';

describe('shared asset catalog', () => {
  it('exposes one ordered avatar catalog and resolves all accepted identifiers', () => {
    expect(avatars.length).toBeGreaterThan(30);
    const avatar = avatars[0];
    expect(findAvatar(avatar.id)).toBe(avatar);
    expect(findAvatar(avatar.picture)).toBe(avatar);
    expect(resolveAvatarSrc(avatar.src)).toBe(avatar.src);
  });

  it('centralizes rank, suit, label and asset-key metadata', () => {
    expect(Object.keys(cardRanks)).toHaveLength(12);
    expect(Object.keys(cardSuits)).toHaveLength(4);
    expect(getCardAssetKey({ rank: 'One', suit: 'Cups' })).toBe('1copas');
    expect(getCardLabel({ rank: 'One', suit: 'Cups' })).toBe('A de copas');
  });

  it('resolves deck and back assets with safe fallbacks', () => {
    const card = { rank: 'One', suit: 'Cups' };
    expect(getCardImageSrc(card, 'spanish')).toBeTruthy();
    expect(getCardImageSrc(card, 'french')).toBeTruthy();
    expect(getCardBackSrc('unknown')).toBe(defaultCardBack);
  });
});
