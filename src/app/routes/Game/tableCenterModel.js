const rankStrength = {
  Four: 0,
  Five: 1,
  Six: 2,
  Seven: 3,
  Ten: 4,
  Eleven: 5,
  Twelve: 6,
  One: 7,
  Two: 8,
  Three: 9,
};

const suitStrength = {
  Golds: 0,
  Swords: 1,
  Cups: 2,
  Clubs: 3,
};

export const nextRank = {
  Eleven: 'Twelve',
  Five: 'Six',
  Four: 'Five',
  One: 'Two',
  Seven: 'Ten',
  Six: 'Seven',
  Ten: 'Eleven',
  Three: 'Four',
  Twelve: 'One',
  Two: 'Three',
};

export function getCardStrength(card, upcard) {
  if (!card) return Number.NEGATIVE_INFINITY;

  const rankValue = rankStrength[card.rank] ?? -1;
  const suitValue = suitStrength[card.suit] ?? -1;
  const baseValue = rankValue * 10 + suitValue;

  return nextRank[upcard?.rank] === card.rank ? baseValue + 100 : baseValue;
}

export function getTurnKey(turn) {
  const card = turn?.card;
  return `${turn?.player_id || ''}:${card?.rank || ''}:${card?.suit || ''}`;
}

export function getStrongestTurn(pile, upcard) {
  return (pile || []).reduce((strongestTurn, turn) => {
    if (!strongestTurn) return turn;

    return getCardStrength(turn.card, upcard) >
      getCardStrength(strongestTurn.card, upcard)
      ? turn
      : strongestTurn;
  }, null);
}

export function createPileVisualModel(pile, elevatedCardKey) {
  return (pile || []).map((turn, sourceIndex) => ({
    isElevated: elevatedCardKey === getTurnKey(turn),
    key: `${sourceIndex}:${getTurnKey(turn)}`,
    sourceIndex,
    turn,
  }));
}

export function getDeckTranslationKey(deckType) {
  if (deckType === 'french') return 'settings.french';
  if (deckType === 'spanish_8bit') return 'settings.spanish8Bit';
  return 'settings.spanish';
}
