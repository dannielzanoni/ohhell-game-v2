import artemisBanner from '@/assets/characters/artemis/banner.png';
import artemisIcon from '@/assets/characters/artemis/icon.png';
import artemisCard1 from '@/assets/characters/artemis/cards/1.png';
import artemisCard2 from '@/assets/characters/artemis/cards/2.png';
import artemisCard3 from '@/assets/characters/artemis/cards/3.png';
import artemisCard4 from '@/assets/characters/artemis/cards/4.png';
import artemisCard5 from '@/assets/characters/artemis/cards/5.png';
import carmenBanner from '@/assets/characters/carmen/banner.png';
import carmenIcon from '@/assets/characters/carmen/icon.png';
import carmenCard2 from '@/assets/characters/carmen/cards/2.png';
import carmenCard4 from '@/assets/characters/carmen/cards/4.png';
import carmenCard5 from '@/assets/characters/carmen/cards/5.png';
import conjuruzBanner from '@/assets/characters/conjuruz/banner.png';
import conjuruzIcon from '@/assets/characters/conjuruz/icon.png';
import gamblerBanner from '@/assets/characters/gambler/banner.png';
import gamblerIcon from '@/assets/characters/gambler/icon.png';
import leandroBanner from '@/assets/characters/leandro/banner.png';
import leandroIcon from '@/assets/characters/leandro/leandro.png';
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
    icon: artemisIcon,
    gameplayStyle: { icons: ['heart_1'], label: 'Lifes' },
    manaInicial: 1,
    manaTotal: 9,
    vidaInicial: 40,
    vidaTotal: 110,
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
    icon: conjuruzIcon,
    gameplayStyle: { icons: ['mana'], label: 'Mana' },
    manaInicial: 1,
    manaTotal: 18,
    markerClass: 'bg-violet-500',
    path: `${hellHandMercenariesPath}/Conjuruz`,
    vidaInicial: 45,
    vidaTotal: 100,
  },
  {
    id: 'carmen',
    accentClass: 'from-rose-500/25 via-black/25 to-amber-500/20',
    banner: carmenBanner,
    icon: carmenIcon,
    gameplayStyle: { icons: ['shield', 'mana'], label: 'Shield & Mana' },
    manaInicial: 1,
    manaTotal: 8,
    cards: [
      { id: 'carmenCard2', image: carmenCard2, manaCost: 2 },
      { id: 'carmenCard4', image: carmenCard4, manaCost: 4 },
      { id: 'carmenCard5', image: carmenCard5, manaCost: 5 },
    ],
    markerClass: 'bg-rose-500',
    path: `${hellHandMercenariesPath}/Carmen`,
    vidaInicial: 60,
    vidaTotal: 100,
  },
  {
    id: 'gambler',
    accentClass: 'from-red-500/25 via-black/25 to-yellow-500/20',
    banner: gamblerBanner,
    icon: gamblerIcon,
    gameplayStyle: { icons: ['bid'], label: 'High Stakes' },
    manaInicial: 1,
    manaTotal: 11,
    cards: [
      { id: 'isRightfullyMine', image: gamblerCard1, manaCost: 3 },
      { id: 'allIn', image: gamblerCard2, manaCost: 3 },
      { id: 'giveItToMe', image: gamblerCard3, manaCost: 5 },
      { id: 'crossYourFingers', image: gamblerCard4, manaCost: 3 },
      { id: 'guabiru', image: gamblerCard5, manaCost: 8 },
    ],
    markerClass: 'bg-red-500',
    path: `${hellHandMercenariesPath}/Gambler`,
    vidaInicial: 45,
    vidaTotal: 100,
  },
  {
    id: 'leandro',
    accentClass: 'from-violet-500/25 via-black/25 to-cyan-500/20',
    banner: leandroBanner,
    cards: [],
    icon: leandroIcon,
    gameplayStyle: { icons: ['mana', 'magic'], label: 'Mana & Magic' },
    manaInicial: 1,
    manaTotal: 13,
    markerClass: 'bg-violet-500',
    path: `${hellHandMercenariesPath}/Leandro`,
    vidaInicial: 50,
    vidaTotal: 100,
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

function getRemoteGameplayStyle(remoteMercenary) {
  return (
    remoteMercenary.gameplay_style ||
    remoteMercenary.gameplayStyle ||
    remoteMercenary.style
  );
}

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
      description: remoteMercenary.description || existing.description,
      gameplayStyle: getRemoteGameplayStyle(remoteMercenary) || existing.gameplayStyle,
      icon: remoteMercenary.icon_url || remoteMercenary.icon || existing.icon,
      manaInicial:
        remoteMercenary.initial_mana ??
        remoteMercenary.initialMana ??
        remoteMercenary.mana_inicial ??
        remoteMercenary.manaInicial ??
        existing.manaInicial ??
        1,
      manaTotal:
        remoteMercenary.mana_total ??
        remoteMercenary.total_mana ??
        remoteMercenary.manaTotal ??
        remoteMercenary.totalMana ??
        existing.manaTotal ??
        10,
      markerClass:
        existing.markerClass || fallbackMarkerClasses[index % fallbackMarkerClasses.length],
      name: remoteMercenary.name || existing.name,
      passiveScript: remoteMercenary.passive_script || existing.passiveScript,
      path: `/mercenaries/${id}`,
      style: remoteMercenary.style || existing.style,
      subtitle: remoteMercenary.subtitle || existing.subtitle,
      temper: remoteMercenary.temper || existing.temper,
      vidaInicial:
        remoteMercenary.base_life ??
        remoteMercenary.baseLife ??
        remoteMercenary.vida_inicial ??
        remoteMercenary.vidaInicial ??
        existing.vidaInicial ??
        40,
      vidaTotal:
        remoteMercenary.vida_total ??
        remoteMercenary.total_life ??
        remoteMercenary.vidaTotal ??
        remoteMercenary.totalLife ??
        existing.vidaTotal ??
        100,
    });
  });

  return Array.from(merged.values());
}

export function normalizeRemoteMercenaries(remoteMercenaries = []) {
  return remoteMercenaries
    .filter((remoteMercenary) => remoteMercenary?.id)
    .map((remoteMercenary, index) => {
      const id = remoteMercenary.id;

      return {
        id,
        accentClass: fallbackAccentClasses[index % fallbackAccentClasses.length],
        banner: remoteMercenary.banner_url || remoteMercenary.banner || '',
        cards: remoteMercenary.cards || remoteMercenary.deck || [],
        deck: remoteMercenary.deck,
        description: remoteMercenary.description,
        gameplayStyle: getRemoteGameplayStyle(remoteMercenary),
        icon: remoteMercenary.icon_url || remoteMercenary.icon || '',
        manaInicial:
          remoteMercenary.initial_mana ??
          remoteMercenary.initialMana ??
          remoteMercenary.mana_inicial ??
          remoteMercenary.manaInicial ??
          1,
        manaTotal:
          remoteMercenary.mana_total ??
          remoteMercenary.total_mana ??
          remoteMercenary.manaTotal ??
          remoteMercenary.totalMana ??
          10,
        markerClass: fallbackMarkerClasses[index % fallbackMarkerClasses.length],
        name: remoteMercenary.name,
        passiveScript: remoteMercenary.passive_script || remoteMercenary.passiveScript,
        path: `/mercenaries/${id}`,
        style: remoteMercenary.style,
        subtitle: remoteMercenary.subtitle,
        temper: remoteMercenary.temper,
        vidaInicial:
          remoteMercenary.base_life ??
          remoteMercenary.baseLife ??
          remoteMercenary.vida_inicial ??
          remoteMercenary.vidaInicial ??
          40,
        vidaTotal:
          remoteMercenary.vida_total ??
          remoteMercenary.total_life ??
          remoteMercenary.vidaTotal ??
          remoteMercenary.totalLife ??
          100,
      };
    });
}

export function findMercenary(id, source = mercenaries) {
  const normalizedId = String(id || '').toLowerCase();

  return source.find((mercenary) => mercenary.id.toLowerCase() === normalizedId);
}
