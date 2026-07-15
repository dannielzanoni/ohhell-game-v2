import { describe, expect, it } from 'vitest';
import { CLASSIC_PATHS } from './paths.js';

describe('CLASSIC_PATHS', () => {
  it('uses the classic route namespace', () => {
    expect(CLASSIC_PATHS.CREATE_GAME).toBe('/classic/create-game');
    expect(CLASSIC_PATHS.game('lobby-42')).toBe('/classic/game/lobby-42');
  });
});
