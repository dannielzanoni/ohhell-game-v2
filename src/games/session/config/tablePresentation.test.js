import { describe, expect, it } from 'vitest';
import { getSeatPosition, PLAYER_ACCENT_COLORS } from './tablePresentation.js';

describe('table presentation', () => {
  it('centers a single current player with the configured lift', () => {
    expect(getSeatPosition(0, 1, true)).toEqual({
      left: '50%',
      top: '58%',
    });
  });

  it('places multiple players around the table orbit', () => {
    expect(getSeatPosition(0, 4)).toEqual({
      left: '50.00%',
      top: '76.00%',
    });
  });

  it('keeps the shared player palette immutable', () => {
    expect(Object.isFrozen(PLAYER_ACCENT_COLORS)).toBe(true);
  });
});
