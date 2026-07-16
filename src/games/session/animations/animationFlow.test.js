import { describe, expect, it } from 'vitest';
import { getAddedTurn, getTurnAnimationKey } from './animationFlow.js';

describe('session animation flow', () => {
  const firstTurn = {
    card: { rank: 'Four', suit: 'Golds' },
    player_id: 'one',
  };
  const secondTurn = {
    card: { rank: 'Five', suit: 'Cups' },
    player_id: 'two',
  };

  it('builds a stable animation key from player and card', () => {
    expect(getTurnAnimationKey(firstTurn)).toBe('one:4ouro');
  });

  it('finds the newly appended turn', () => {
    expect(getAddedTurn([firstTurn], [firstTurn, secondTurn])).toBe(secondTurn);
  });
});
