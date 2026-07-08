import artemisBanner from '@/assets/characters/artemis/banner.png';
import artemisCard1 from '@/assets/characters/artemis/cards/1.png';
import artemisCard2 from '@/assets/characters/artemis/cards/2.png';
import artemisCard3 from '@/assets/characters/artemis/cards/3.png';
import artemisCard4 from '@/assets/characters/artemis/cards/4.png';
import artemisCard5 from '@/assets/characters/artemis/cards/5.png';
import carmenBanner from '@/assets/characters/carmen/banner.png';
import carmenCard2 from '@/assets/characters/carmen/cards/2.png';
import carmenCard4 from '@/assets/characters/carmen/cards/4.png';
import carmenCard5 from '@/assets/characters/carmen/cards/5.png';
import conjuruzBanner from '@/assets/characters/conjuruz/banner.png';
import gamblerBanner from '@/assets/characters/gambler/banner.png';
import leandroBanner from '@/assets/characters/leandro/banner.png';
import gamblerCard1 from '@/assets/characters/gambler/cards/1.png'; 
import gamblerCard2 from '@/assets/characters/gambler/cards/2.png';
import gamblerCard3 from '@/assets/characters/gambler/cards/3.png';
import gamblerCard4 from '@/assets/characters/gambler/cards/4.png';
import gamblerCard5 from '@/assets/characters/gambler/cards/5.png';

const hellHandMercenariesPath = '/hell-hand/mercenaries';

export const mercenaries = [
  {
    id: 'artemis',
    accentClass: 'from-emerald-500/25 via-black/25 to-amber-500/20',
    banner: artemisBanner,
    bannerPosition: 'center 35%',
    cards: [
      { id: 'bloodTransfusion', image: artemisCard1, manaCost: 2 },
      { id: 'deepRed', image: artemisCard2, manaCost: 8 },
      { id: 'madJustice', image: artemisCard3, manaCost: 4 },
      { id: 'signInBlood', image: artemisCard4, manaCost: 3 },
      { id: 'hunterGrace', image: artemisCard5, manaCost: 1 },
    ],
    markerClass: 'bg-emerald-500',
    path: `${hellHandMercenariesPath}/Artemis`,
  },
  {
    id: 'conjuruz',
    accentClass: 'from-violet-500/25 via-black/25 to-cyan-500/20',
    banner: conjuruzBanner,
    cards: [],
    markerClass: 'bg-violet-500',
    path: `${hellHandMercenariesPath}/Conjuruz`,
  },
  {
    id: 'carmen',
    accentClass: 'from-rose-500/25 via-black/25 to-amber-500/20',
    banner: carmenBanner,
    cards: [
      { id: 'carmenCard2', image: carmenCard2, manaCost: 2 },
      { id: 'carmenCard4', image: carmenCard4, manaCost: 4 },
      { id: 'carmenCard5', image: carmenCard5, manaCost: 5 },
    ],
    markerClass: 'bg-rose-500',
    path: `${hellHandMercenariesPath}/Carmen`,
  },
  {
    id: 'gambler',
    accentClass: 'from-red-500/25 via-black/25 to-yellow-500/20',
    banner: gamblerBanner,
    cards: [
      { id: 'isRightfullyMine', image: gamblerCard1, manaCost: 3 },
      { id: 'allIn', image: gamblerCard2, manaCost: 3 },
      { id: 'giveItToMe', image: gamblerCard3, manaCost: 5 },
      { id: 'crossYourFingers', image: gamblerCard4, manaCost: 3 },
      { id: 'guabiru', image: gamblerCard5, manaCost: 8 },
    ],
    markerClass: 'bg-red-500',
    path: `${hellHandMercenariesPath}/Gambler`,
  },
  {
    id: 'leandro',
    accentClass: 'from-violet-500/25 via-black/25 to-cyan-500/20',
    banner: leandroBanner,
    cards: [],
    markerClass: 'bg-violet-500',
    path: `${hellHandMercenariesPath}/Leandro`,
  },
];

const fallbackAccentClasses = [
  'from-emerald-500/25 via-black/25 to-amber-500/20',
  'from-violet-500/25 via-black/25 to-cyan-500/20',
  'from-red-500/25 via-black/25 to-yellow-500/20',
  'from-sky-500/25 via-black/25 to-fuchsia-500/20',
];

const fallbackMarkerClasses = [
  'bg-emerald-500',
  'bg-violet-500',
  'bg-red-500',
  'bg-sky-500',
];

export function getMercenaryTitle(mercenary, t) {
  if (mercenary?.name) {
    return mercenary.name;
  }

  return t(`pages.characters.items.${mercenary.id}.title`);
}

export function getMercenarySubtitle(mercenary, t) {
  if (mercenary?.subtitle) {
    return mercenary.subtitle;
  }

  return t(`pages.characters.items.${mercenary.id}.subtitle`);
}

export function mergeMercenaries(remoteMercenaries = []) {
  const merged = new Map(mercenaries.map((mercenary) => [mercenary.id, mercenary]));

  remoteMercenaries.forEach((remoteMercenary, index) => {
    const id = remoteMercenary.id;

    if (!id) {
      return;
    }

    const existing = merged.get(id) || {};

    merged.set(id, {
      ...existing,
      id,
      accentClass:
        existing.accentClass || fallbackAccentClasses[index % fallbackAccentClasses.length],
      banner: remoteMercenary.banner_url || existing.banner,
      cards: existing.cards || [],
      deck: remoteMercenary.deck || existing.deck,
      description: remoteMercenary.description || existing.description,
      markerClass:
        existing.markerClass || fallbackMarkerClasses[index % fallbackMarkerClasses.length],
      name: remoteMercenary.name || existing.name,
      passiveScript: remoteMercenary.passive_script || existing.passiveScript,
      path: `/mercenaries/${id}`,
      style: remoteMercenary.style || existing.style,
      subtitle: remoteMercenary.subtitle || existing.subtitle,
      temper: remoteMercenary.temper || existing.temper,
    });
  });

  return Array.from(merged.values());
}

export function findMercenary(id, source = mercenaries) {
  const normalizedId = String(id || '').toLowerCase();

  return source.find((mercenary) => mercenary.id.toLowerCase() === normalizedId);
}
