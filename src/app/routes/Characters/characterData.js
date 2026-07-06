import artemisBanner from '@/assets/characters/artemis/banner.png';
import artemisCard1 from '@/assets/characters/artemis/cards/1.png';
import artemisCard2 from '@/assets/characters/artemis/cards/2.png';
import artemisCard3 from '@/assets/characters/artemis/cards/3.png';
import artemisCard4 from '@/assets/characters/artemis/cards/4.png';
import artemisCard5 from '@/assets/characters/artemis/cards/5.png';
import conjuruzBanner from '@/assets/characters/conjuruz/banner.png';
import gamblerBanner from '@/assets/characters/gambler/banner.png';
import gamblerCard1 from '@/assets/characters/gambler/cards/1.png'; 
import gamblerCard2 from '@/assets/characters/gambler/cards/2.png';
import gamblerCard3 from '@/assets/characters/gambler/cards/3.png';
import gamblerCard4 from '@/assets/characters/gambler/cards/4.png';
import gamblerCard5 from '@/assets/characters/gambler/cards/5.png';

export const mercenaries = [
  {
    id: 'artemis',
    accentClass: 'from-emerald-500/25 via-black/25 to-amber-500/20',
    banner: artemisBanner,
    bannerPosition: 'center 35%',
    cards: [
      { id: 'bloodTransfusion', image: artemisCard1, manaCost: 2 },
      { id: 'deepRed', image: artemisCard2, manaCost: 3 },
      { id: 'madJustice', image: artemisCard3, manaCost: 4 },
      { id: 'signInBlood', image: artemisCard4, manaCost: 2 },
      { id: 'hunterGrace', image: artemisCard5, manaCost: 3 },
    ],
    markerClass: 'bg-emerald-500',
    path: '/mercenaries/Artemis',
  },
  {
    id: 'conjuruz',
    accentClass: 'from-violet-500/25 via-black/25 to-cyan-500/20',
    banner: conjuruzBanner,
    cards: [],
    markerClass: 'bg-violet-500',
    path: '/mercenaries/Conjuruz',
  },
  {
    id: 'gambler',
    accentClass: 'from-red-500/25 via-black/25 to-yellow-500/20',
    banner: gamblerBanner,
    cards: [
      { id: 'isRightfullyMine', image: gamblerCard1, manaCost: 2 },
      { id: 'allIn', image: gamblerCard2, manaCost: 5 },
      { id: 'giveItToMe', image: gamblerCard3, manaCost: 4 },
      { id: 'crossYourFingers', image: gamblerCard4, manaCost: 3 },
      { id: 'guabiru', image: gamblerCard5, manaCost: 1 },
    ],
    markerClass: 'bg-red-500',
    path: '/mercenaries/Gambler',
  },
];

export function findMercenary(id) {
  return mercenaries.find((mercenary) => mercenary.id === id);
}
