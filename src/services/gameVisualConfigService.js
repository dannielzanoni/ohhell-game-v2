const desktopVisualConfig = Object.freeze({
  tableScale: 1,
  centerScale: 1,
  centerOffsetX: 0,
  centerOffsetY: 0,
  seatScale: 1,
  seatOrbitX: 36,
  seatOrbitY: 28,
  seatLift: 2,
  bidControlScale: 1,
  bidControlOffsetX: 0,
  bidControlOffsetY: 0,
  powerDeckControlScale: 1,
  powerDeckControlOffsetX: 0,
  powerDeckControlOffsetY: 0,
  classicHandScale: 1,
  classicHandAreaHeightVh: 0,
  classicHandBoxWidthVw: 0,
  classicHandBoxOffsetX: 0,
  classicHandBoxOffsetY: 0,
  classicHandOffsetY: 0,
  powerHandScale: 1,
  powerHandOffsetX: 0,
  powerHandOffsetY: 0,
  animationDuration: 520,
  animationDelay: 180,
});

const mobileVisualConfig = Object.freeze({
  ...desktopVisualConfig,
  tableInfoScale: 1,
  tableInfoOffsetX: 0,
  tableInfoOffsetY: 0,
  timerScale: 1,
  timerOffsetX: 0,
  timerOffsetY: 0,
  classicHandOffsetX: 0,
});

// These three profiles are the single source of truth for the Classic table.
// The playground edits a preview copy; once its values are approved, they are
// promoted here and immediately become the values used by /game.
export const OFFICIAL_GAME_VISUAL_CONFIG = Object.freeze({
  desktop: desktopVisualConfig,
  mobilePortrait: Object.freeze({ ...mobileVisualConfig }),
  mobileLandscape: Object.freeze({
    ...mobileVisualConfig,
    classicHandAreaHeightVh: 38,
    classicHandBoxWidthVw: 92,
  }),
});

export function getGameVisualConfig({ isLandscape = false, isMobile = false } = {}) {
  if (!isMobile) return OFFICIAL_GAME_VISUAL_CONFIG.desktop;

  return isLandscape
    ? OFFICIAL_GAME_VISUAL_CONFIG.mobileLandscape
    : OFFICIAL_GAME_VISUAL_CONFIG.mobilePortrait;
}
