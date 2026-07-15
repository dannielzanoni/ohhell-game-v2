const rankLabels = {
  Eight: '8',
  Eleven: '11',
  Five: '5',
  Four: '4',
  Nine: '9',
  One: 'A',
  Seven: '7',
  Six: '6',
  Ten: '10',
  Three: '3',
  Twelve: '12',
  Two: '2',
};

const rankCodes = {
  ...rankLabels,
  One: '1',
};

const suitLabels = {
  Clubs: 'paus',
  Cups: 'copas',
  Golds: 'ouro',
  Swords: 'espada',
};

const suitTranslationKeys = {
  Clubs: 'clubs',
  Cups: 'cups',
  Golds: 'golds',
  Swords: 'swords',
};

export function getClassicCardLabel(card) {
  if (!card) {
    return '';
  }

  if (card.name) {
    return card.name;
  }

  const rank = rankLabels[card.rank] || card.rank;
  const suit = suitLabels[card.suit] || card.suit;

  return `${rank} de ${suit}`;
}

export function getClassicCardRankCode(card) {
  return rankCodes[card?.rank] || card?.rank || '?';
}

export function getClassicSuitTranslationKey(card) {
  return suitTranslationKeys[card?.suit] || '';
}
