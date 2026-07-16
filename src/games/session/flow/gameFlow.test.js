import { describe, expect, it } from 'vitest';
import {
  getGamePile,
  getInitialSetCardCount,
  getPlayedCountsByPlayer,
  getSeatCardCount,
  orderPlayersClockwise,
} from './gameFlow.js';

describe('session game flow', () => {
  it('reads nested pile formats supported by the game protocol', () => {
    const pile = [{ player_id: 'one' }];
    expect(getGamePile({ stage: { data: { pile } } })).toBe(pile);
  });

  it('derives the initial hand size from deck, rounds and local play', () => {
    const game = {
      deck: [{}, {}],
      info: [{ rounds: 1 }, { rounds: 2 }],
      pile: [{ player_id: 'local' }],
    };
    expect(getInitialSetCardCount(game, ['local'])).toBe(6);
  });

  it('rotates the player order around the current player', () => {
    const players = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    expect(orderPlayersClockwise(players, ['a', 'b', 'c'], 'b').map(({ id }) => id)).toEqual([
      'b',
      'c',
      'a',
    ]);
  });

  it('calculates hidden seat cards from completed plays', () => {
    const counts = getPlayedCountsByPlayer([{ player_id: 'remote' }, { player_id: 'remote' }]);
    expect(
      getSeatCardCount({
        isCurrent: false,
        playerDeckLength: 0,
        playerId: 'remote',
        playedCountsByPlayer: counts,
        roundCardCount: 5,
      }),
    ).toBe(3);
  });
});
