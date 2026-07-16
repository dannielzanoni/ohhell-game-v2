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

const nextRank = {
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

export function getClassicCardStrength(card, upcard) {
  if (!card) {
    return Number.NEGATIVE_INFINITY;
  }

  const rankValue = rankStrength[card.rank] ?? -1;
  const suitValue = suitStrength[card.suit] ?? -1;
  const baseValue = rankValue * 10 + suitValue;

  return nextRank[upcard?.rank] === card.rank ? baseValue + 100 : baseValue;
}

export function getStrongestClassicTurn(pile, upcard) {
  return (pile || []).reduce((strongestTurn, turn) => {
    if (!strongestTurn) {
      return turn;
    }

    return getClassicCardStrength(turn.card, upcard) >
      getClassicCardStrength(strongestTurn.card, upcard)
      ? turn
      : strongestTurn;
  }, null);
}

export function getClassicPlayableCards(cards, pile) {
  if (!cards?.length || !pile?.length) {
    return cards || [];
  }

  const leadSuit = pile[0]?.card?.suit;

  if (!leadSuit) {
    return cards;
  }

  const matchingSuitCards = cards.filter((card) => card?.suit === leadSuit);
  return matchingSuitCards.length ? matchingSuitCards : cards;
}

export function removeClassicCardFromDeck(deck, card) {
  let wasRemoved = false;

  return deck.filter((deckCard) => {
    const isSameCard = deckCard?.rank === card?.rank && deckCard?.suit === card?.suit;

    if (!wasRemoved && isSameCard) {
      wasRemoved = true;
      return false;
    }

    return true;
  });
}
