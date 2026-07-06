import { describe, expect, it } from 'vitest';
import { reduceLifeLossEvents } from './lifeLossReducer.js';

describe('life loss reducer', () => {
  it('calculates every positive loss from shared previous state', () => {
    expect(reduceLifeLossEvents(
      { ada: { lifes: 5 }, grace: { lifes: 4 } },
      { ada: 4, grace: 1 },
    )).toEqual([
      { lost: 1, nextLifes: 4, playerId: 'ada', previousLifes: 5 },
      { lost: 3, nextLifes: 1, playerId: 'grace', previousLifes: 4 },
    ]);
  });

  it('ignores unchanged, increased, and invalid values', () => {
    expect(reduceLifeLossEvents({ ada: { lifes: 3 } }, { ada: 4, grace: 'x' })).toEqual([]);
  });
});
