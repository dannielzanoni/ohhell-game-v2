import spanishCard3Paus from '@/assets/cards/spanish/3paus.jpg';
import spanish8BitCard3Paus from '@/assets/cards/spanish_8bit/3paus.png';
import frenchCard3Paus from '@/assets/cards/french/3paus.png';
import { deckTypes } from '@/services/gamePreferencesService.js';

export const deckOptions = Object.freeze([
  {
    image: spanishCard3Paus,
    labelKey: 'settings.spanish',
    value: deckTypes.SPANISH,
  },
  {
    image: spanish8BitCard3Paus,
    labelKey: 'settings.spanish8Bit',
    value: deckTypes.SPANISH_8BIT,
  },
  {
    image: frenchCard3Paus,
    labelKey: 'settings.french',
    value: deckTypes.FRENCH,
  },
]);
