import { deckTypes } from '@/features/settings/model/gamePreferences.js';

const spanishCardImages = import.meta.glob('/src/games/classic/assets/cards/spanish/*.jpg', {
  eager: true,
  import: 'default',
});

const spanish8BitCardImages = import.meta.glob(
  '/src/games/classic/assets/cards/spanish-8bit/*.png',
  {
    eager: true,
    import: 'default',
  },
);

const frenchCardImages = import.meta.glob('/src/games/classic/assets/cards/french/*.png', {
  eager: true,
  import: 'default',
});

const cardBackImages = import.meta.glob('/src/games/classic/assets/cards/backs/back_card*.png', {
  eager: true,
  import: 'default',
});

const playerTurnSounds = import.meta.glob('/src/games/classic/assets/sounds/turn-sounds/*.mp3', {
  eager: true,
  import: 'default',
});

const rankToAsset = {
  Eight: '8',
  Eleven: '11',
  Five: '5',
  Four: '4',
  Nine: '9',
  One: '1',
  Seven: '7',
  Six: '6',
  Ten: '10',
  Three: '3',
  Twelve: '12',
  Two: '2',
};

const suitToAsset = {
  Clubs: 'paus',
  Cups: 'copas',
  Golds: 'ouro',
  Swords: 'espada',
};

export const DEFAULT_CLASSIC_CARD_BACK =
  cardBackImages['/src/games/classic/assets/cards/backs/back_card.png'];

export const CLASSIC_SUIT_CARDS = Object.freeze([
  ['golds', spanish8BitCardImages['/src/games/classic/assets/cards/spanish-8bit/1ouro.png']],
  ['swords', spanish8BitCardImages['/src/games/classic/assets/cards/spanish-8bit/1espada.png']],
  ['cups', spanish8BitCardImages['/src/games/classic/assets/cards/spanish-8bit/1copas.png']],
  ['clubs', spanish8BitCardImages['/src/games/classic/assets/cards/spanish-8bit/1paus.png']],
]);

export function getClassicCardKey(card) {
  if (!card) {
    return '';
  }

  const rank = rankToAsset[card.rank];
  const suit = suitToAsset[card.suit];

  return rank && suit ? `${rank}${suit}` : '';
}

export function getClassicCardBackSrc(cardBack) {
  if (!cardBack) {
    return DEFAULT_CLASSIC_CARD_BACK;
  }

  return (
    cardBackImages[`/src/games/classic/assets/cards/backs/${cardBack}.png`] ||
    DEFAULT_CLASSIC_CARD_BACK
  );
}

export function getClassicCardImageSrc(
  card,
  deckType = deckTypes.SPANISH,
  fallbackSrc = DEFAULT_CLASSIC_CARD_BACK,
) {
  if (card?.image || card?.image_url) {
    return card.image || card.image_url;
  }

  const key = getClassicCardKey(card);

  if (deckType === deckTypes.FRENCH) {
    return frenchCardImages[`/src/games/classic/assets/cards/french/${key}.png`] || fallbackSrc;
  }

  if (deckType === deckTypes.SPANISH_8BIT) {
    return (
      spanish8BitCardImages[`/src/games/classic/assets/cards/spanish-8bit/${key}.png`] ||
      spanishCardImages[`/src/games/classic/assets/cards/spanish/${key}.jpg`] ||
      fallbackSrc
    );
  }

  return spanishCardImages[`/src/games/classic/assets/cards/spanish/${key}.jpg`] || fallbackSrc;
}

export function getClassicPlayerTurnSound(soundName) {
  const normalizedName = String(soundName || 'Default').toLowerCase();
  const matchingEntry = Object.entries(playerTurnSounds).find(([path]) => {
    const fileName = decodeURIComponent(
      path
        .split('/')
        .pop()
        .replace(/\.mp3$/i, ''),
    );
    return fileName.toLowerCase() === normalizedName;
  });

  return (
    matchingEntry?.[1] ||
    playerTurnSounds['/src/games/classic/assets/sounds/turn-sounds/Default.mp3']
  );
}
