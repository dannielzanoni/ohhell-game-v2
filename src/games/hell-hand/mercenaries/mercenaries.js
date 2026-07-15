import artemisBanner from '@/games/hell-hand/assets/characters/artemis/banner.png';
import artemisIcon from '@/games/hell-hand/assets/characters/artemis/icon.png';
import artemisCard1 from '@/games/hell-hand/assets/characters/artemis/cards/1.png';
import artemisCard2 from '@/games/hell-hand/assets/characters/artemis/cards/2.png';
import artemisCard3 from '@/games/hell-hand/assets/characters/artemis/cards/3.png';
import artemisCard4 from '@/games/hell-hand/assets/characters/artemis/cards/4.png';
import artemisCard5 from '@/games/hell-hand/assets/characters/artemis/cards/5.png';
import carmenBanner from '@/games/hell-hand/assets/characters/carmen/banner.png';
import carmenIcon from '@/games/hell-hand/assets/characters/carmen/icon.png';
import carmenCard2 from '@/games/hell-hand/assets/characters/carmen/cards/2.png';
import carmenCard4 from '@/games/hell-hand/assets/characters/carmen/cards/4.png';
import carmenCard5 from '@/games/hell-hand/assets/characters/carmen/cards/5.png';
import conjuruzBanner from '@/games/hell-hand/assets/characters/conjuruz/banner.png';
import conjuruzIcon from '@/games/hell-hand/assets/characters/conjuruz/icon.png';
import gamblerBanner from '@/games/hell-hand/assets/characters/gambler/banner.png';
import gamblerIcon from '@/games/hell-hand/assets/characters/gambler/icon.png';
import leandroBanner from '@/games/hell-hand/assets/characters/leandro/banner.png';
import leandroIcon from '@/games/hell-hand/assets/characters/leandro/leandro.png';
import gamblerCard1 from '@/games/hell-hand/assets/characters/gambler/cards/1.png'; 
import gamblerCard2 from '@/games/hell-hand/assets/characters/gambler/cards/2.png';
import gamblerCard3 from '@/games/hell-hand/assets/characters/gambler/cards/3.png';
import gamblerCard4 from '@/games/hell-hand/assets/characters/gambler/cards/4.png';
import gamblerCard5 from '@/games/hell-hand/assets/characters/gambler/cards/5.png';

const hellHandMercenariesPath = '/hell-hand/mercenaries';

export const mercenaries = [
  {
    id: 'artemis',
    accentClass: 'from-red-500/25 via-black/25 to-red-950/30',
    styleGlowClass: 'bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.21),transparent_48%)]',
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
    markerClass: 'bg-red-500',
    path: `${hellHandMercenariesPath}/Artemis`,
  },
  {
    id: 'conjuruz',
    accentClass: 'from-blue-500/25 via-black/25 to-blue-950/30',
    styleGlowClass: 'bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.21),transparent_48%)]',
    banner: conjuruzBanner,
    cards: [],
    icon: conjuruzIcon,
    gameplayStyle: { icons: ['mana'], label: 'Mana' },
    manaInicial: 1,
    manaTotal: 18,
    markerClass: 'bg-blue-500',
    path: `${hellHandMercenariesPath}/Conjuruz`,
    vidaInicial: 45,
    vidaTotal: 100,
  },
  {
    id: 'carmen',
    accentClass: 'from-green-500/25 via-black/25 to-green-950/30',
    styleGlowClass: 'bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.21),transparent_48%)]',
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
    markerClass: 'bg-green-500',
    path: `${hellHandMercenariesPath}/Carmen`,
    vidaInicial: 60,
    vidaTotal: 100,
  },
  {
    id: 'gambler',
    accentClass: 'from-yellow-400/25 via-black/25 to-yellow-950/30',
    styleGlowClass: 'bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.21),transparent_48%)]',
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
    markerClass: 'bg-yellow-400',
    path: `${hellHandMercenariesPath}/Gambler`,
    vidaInicial: 45,
    vidaTotal: 100,
  },
  {
    id: 'leandro',
    accentClass: 'from-blue-500/25 via-black/25 to-blue-950/30',
    styleGlowClass: 'bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.21),transparent_48%)]',
    banner: leandroBanner,
    cards: [],
    icon: leandroIcon,
    gameplayStyle: { icons: ['mana', 'magic'], label: 'Mana & Magic' },
    manaInicial: 1,
    manaTotal: 13,
    markerClass: 'bg-blue-500',
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

function getStyleVisuals(style) {
  const value = typeof style === 'object'
    ? `${style?.label || ''} ${(style?.icons || []).join(' ')}`
    : String(style || '');
  const normalized = value.toLowerCase();

  if (normalized.includes('shield')) {
    return {
      accentClass: 'from-green-500/25 via-black/25 to-green-950/30',
      markerClass: 'bg-green-500',
      styleGlowClass: 'bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.21),transparent_48%)]',
    };
  }
  if (normalized.includes('life') || normalized.includes('live') || normalized.includes('vida')) {
    return {
      accentClass: 'from-red-500/25 via-black/25 to-red-950/30',
      markerClass: 'bg-red-500',
      styleGlowClass: 'bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.21),transparent_48%)]',
    };
  }
  if (normalized.includes('bid')) {
    return {
      accentClass: 'from-yellow-400/25 via-black/25 to-yellow-950/30',
      markerClass: 'bg-yellow-400',
      styleGlowClass: 'bg-[radial-gradient(circle_at_top_right,rgba(250,204,21,0.21),transparent_48%)]',
    };
  }
  if (normalized.includes('mana')) {
    return {
      accentClass: 'from-blue-500/25 via-black/25 to-blue-950/30',
      markerClass: 'bg-blue-500',
      styleGlowClass: 'bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.21),transparent_48%)]',
    };
  }

  return null;
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
    const apiId = remoteMercenary.id;

    if (!apiId) {
      return;
    }

    const normalizedName = String(remoteMercenary.name || '').toLowerCase();
    const existing = Array.from(merged.values()).find((mercenary) =>
      mercenary.id.toLowerCase() === String(apiId).toLowerCase() ||
      mercenary.id.toLowerCase() === normalizedName ||
      String(mercenary.name || '').toLowerCase() === normalizedName,
    ) || {};
    const id = existing.id || apiId;
    const gameplayStyle = getRemoteGameplayStyle(remoteMercenary) || existing.gameplayStyle;
    const styleVisuals = getStyleVisuals(gameplayStyle) || {};

    merged.set(id, {
      ...existing,
      id,
      apiId,
      accentClass: styleVisuals.accentClass ||
        existing.accentClass || fallbackAccentClasses[index % fallbackAccentClasses.length],
      banner: remoteMercenary.banner_url || existing.banner,
      cards: existing.cards || [],
      description: remoteMercenary.description || existing.description,
      gameplayStyle,
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
      markerClass: styleVisuals.markerClass ||
        existing.markerClass || fallbackMarkerClasses[index % fallbackMarkerClasses.length],
      styleGlowClass: styleVisuals.styleGlowClass || existing.styleGlowClass,
      name: remoteMercenary.name || existing.name,
      passiveScript: remoteMercenary.passive_script || existing.passiveScript,
      path: `${hellHandMercenariesPath}/${encodeURIComponent(remoteMercenary.name || id)}`,
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
      const gameplayStyle = getRemoteGameplayStyle(remoteMercenary);
      const styleVisuals = getStyleVisuals(gameplayStyle) || {};

      return {
        id,
        apiId: id,
        accentClass: styleVisuals.accentClass || fallbackAccentClasses[index % fallbackAccentClasses.length],
        banner: remoteMercenary.banner_url || remoteMercenary.banner || '',
        cards: remoteMercenary.cards || remoteMercenary.deck || [],
        deck: remoteMercenary.deck,
        description: remoteMercenary.description,
        gameplayStyle,
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
        markerClass: styleVisuals.markerClass || fallbackMarkerClasses[index % fallbackMarkerClasses.length],
        styleGlowClass: styleVisuals.styleGlowClass,
        name: remoteMercenary.name,
        passiveScript: remoteMercenary.passive_script || remoteMercenary.passiveScript,
        path: `${hellHandMercenariesPath}/${encodeURIComponent(remoteMercenary.name || id)}`,
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

  return source.find((mercenary) =>
    mercenary.id.toLowerCase() === normalizedId ||
    String(mercenary.name || '').toLowerCase() === normalizedId,
  );
}
