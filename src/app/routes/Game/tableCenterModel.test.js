import { describe, expect, it } from 'vitest';
import {
  createPileVisualModel,
  getCardStrength,
  getDeckTranslationKey,
  getStrongestTurn,
  getTurnKey,
} from './tableCenterModel.js';

const upcard = { rank: 'Four', suit: 'Golds' };
const pile = [
  { player_id: 'first', card: { rank: 'Three', suit: 'Clubs' } },
  { player_id: 'second', card: { rank: 'Four', suit: 'Golds' } },
  { player_id: 'third', card: { rank: 'Five', suit: 'Cups' } },
];

describe('table center model', () => {
  it('preserves the server pile order and player origin', () => {
    const model = createPileVisualModel(pile, '');

    expect(model.map(({ sourceIndex, turn }) => [sourceIndex, turn.player_id]))
      .toEqual([[0, 'first'], [1, 'second'], [2, 'third']]);
  });

  it('marks a weak card without changing the source pile or its order', () => {
    const original = structuredClone(pile);
    const weakKey = getTurnKey(pile[1]);
    const model = createPileVisualModel(pile, weakKey);

    expect(model.map(({ turn }) => turn.player_id)).toEqual(['first', 'second', 'third']);
    expect(model.map(({ isElevated }) => isElevated)).toEqual([false, true, false]);
    expect(pile).toEqual(original);
  });

  it('keeps strength calculation in the shared model, outside the view', () => {
    expect(getStrongestTurn(pile, upcard)).toBe(pile[2]);
    expect(getCardStrength(pile[2].card, upcard)).toBeGreaterThan(
      getCardStrength(pile[0].card, upcard),
    );
  });

  it('maps every supported selected deck to its translated label', () => {
    expect(['spanish', 'spanish_8bit', 'french'].map(getDeckTranslationKey)).toEqual([
      'settings.spanish',
      'settings.spanish8Bit',
      'settings.french',
    ]);
  });
});
