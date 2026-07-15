import { describe, expect, it } from 'vitest';
import { getClassicCardStrength } from './cardRules.js';

describe('getClassicCardStrength', () => {
  it('orders cards by the Classic rank and suit rules', () => {
    const weakest = getClassicCardStrength({ rank: 'Four', suit: 'Golds' });
    const strongest = getClassicCardStrength({ rank: 'Three', suit: 'Clubs' });

    expect(strongest).toBeGreaterThan(weakest);
  });

  it('promotes the rank following the upcard to joker strength', () => {
    const regularThree = getClassicCardStrength(
      { rank: 'Three', suit: 'Clubs' },
      { rank: 'Four', suit: 'Golds' },
    );
    const jokerFive = getClassicCardStrength(
      { rank: 'Five', suit: 'Golds' },
      { rank: 'Four', suit: 'Golds' },
    );

    expect(jokerFive).toBeGreaterThan(regularThree);
  });

  it('treats an absent card as non-playable', () => {
    expect(getClassicCardStrength(null)).toBe(Number.NEGATIVE_INFINITY);
  });
});
