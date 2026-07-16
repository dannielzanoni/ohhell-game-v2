import { describe, expect, it } from 'vitest';
import { removePowerCardFromHand } from './powerCardRules.js';

describe('removePowerCardFromHand', () => {
  it('removes only the first card with the requested id', () => {
    const cards = [{ id: 'heal' }, { id: 'heal' }, { id: 'shield' }];
    expect(removePowerCardFromHand(cards, 'heal')).toEqual([{ id: 'heal' }, { id: 'shield' }]);
  });
});
