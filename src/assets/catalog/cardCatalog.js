const spanishCards = import.meta.glob('../cards/spanish/*.jpg', {
  eager: true, import: 'default',
});
const pixelCards = import.meta.glob('../cards/spanish_8bit/*.png', {
  eager: true, import: 'default',
});
const frenchCards = import.meta.glob('../cards/french/*.png', {
  eager: true, import: 'default',
});
const cardBacks = import.meta.glob('../cards/back_cards/back_card*.png', {
  eager: true, import: 'default',
});

export const cardRanks = Object.freeze({
  Eight: { asset: '8', label: '8', labelKey: 'cards.ranks.eight' },
  Eleven: { asset: '11', label: '11', labelKey: 'cards.ranks.eleven' },
  Five: { asset: '5', label: '5', labelKey: 'cards.ranks.five' },
  Four: { asset: '4', label: '4', labelKey: 'cards.ranks.four' },
  Nine: { asset: '9', label: '9', labelKey: 'cards.ranks.nine' },
  One: { asset: '1', label: 'A', labelKey: 'cards.ranks.one' },
  Seven: { asset: '7', label: '7', labelKey: 'cards.ranks.seven' },
  Six: { asset: '6', label: '6', labelKey: 'cards.ranks.six' },
  Ten: { asset: '10', label: '10', labelKey: 'cards.ranks.ten' },
  Three: { asset: '3', label: '3', labelKey: 'cards.ranks.three' },
  Twelve: { asset: '12', label: '12', labelKey: 'cards.ranks.twelve' },
  Two: { asset: '2', label: '2', labelKey: 'cards.ranks.two' },
});
export const cardSuits = Object.freeze({
  Clubs: { asset: 'paus', label: 'paus', labelKey: 'cards.suits.clubs' },
  Cups: { asset: 'copas', label: 'copas', labelKey: 'cards.suits.cups' },
  Golds: { asset: 'ouro', label: 'ouro', labelKey: 'cards.suits.golds' },
  Swords: { asset: 'espada', label: 'espada', labelKey: 'cards.suits.swords' },
});

export const defaultCardBack = cardBacks['../cards/back_cards/back_card.png'];

export function getRankLabel(rank, translate) {
  const metadata = cardRanks[rank];
  return metadata
    ? translate?.(metadata.labelKey, metadata.label) || metadata.label
    : rank || '';
}

export function getSuitLabel(suit, translate) {
  const metadata = cardSuits[suit];
  return metadata
    ? translate?.(metadata.labelKey, metadata.label) || metadata.label
    : suit || '';
}

export function getCardAssetKey(card) {
  const rank = cardRanks[card?.rank]?.asset;
  const suit = cardSuits[card?.suit]?.asset;
  return rank && suit ? `${rank}${suit}` : '';
}

export function getCardLabel(card, translate) {
  if (!card) return '';
  return `${getRankLabel(card.rank, translate)} de ${getSuitLabel(card.suit, translate)}`;
}

export function getCardBackSrc(cardBack) {
  return cardBacks[`../cards/back_cards/${cardBack || 'back_card'}.png`] || defaultCardBack;
}

export function getCardImageSrc(card, deckType = 'spanish', fallback = defaultCardBack) {
  const key = getCardAssetKey(card);
  if (deckType === 'french') return frenchCards[`../cards/french/${key}.png`] || fallback;
  if (deckType === 'spanish_8bit') {
    return pixelCards[`../cards/spanish_8bit/${key}.png`]
      || spanishCards[`../cards/spanish/${key}.jpg`] || fallback;
  }
  return spanishCards[`../cards/spanish/${key}.jpg`] || fallback;
}
