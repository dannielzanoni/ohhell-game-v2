import { describe, expect, it } from 'vitest';
import { GAME_MODULE_IDS, GAME_TYPES, getGameTypeOption } from './gameTypes.js';

describe('gameTypesService', () => {
  it('preserves the backend identifiers for both games', () => {
    expect(GAME_TYPES.CLASSIC).toBe('fodinha_classic');
    expect(GAME_TYPES.HELL_HAND).toBe('fodinha_power');
    expect(GAME_MODULE_IDS.HELL_HAND).toBe('hell_hand');
  });

  it('returns metadata only for supported game types', () => {
    expect(getGameTypeOption(GAME_TYPES.CLASSIC)?.value).toBe(GAME_TYPES.CLASSIC);
    expect(getGameTypeOption(GAME_TYPES.HELL_HAND)?.value).toBe(GAME_TYPES.HELL_HAND);
    expect(getGameTypeOption('unsupported')).toBeNull();
  });
});
