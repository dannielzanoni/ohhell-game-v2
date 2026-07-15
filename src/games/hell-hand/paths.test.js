import { describe, expect, it } from 'vitest';
import { HELL_HAND_PATHS } from './paths.js';

describe('HELL_HAND_PATHS', () => {
  it('uses hell-hand externally while the internal module id stays hell_hand', () => {
    expect(HELL_HAND_PATHS.CREATE_GAME).toBe('/hell-hand/create-game');
    expect(HELL_HAND_PATHS.game('lobby-42')).toBe('/hell-hand/game/lobby-42');
  });
});
