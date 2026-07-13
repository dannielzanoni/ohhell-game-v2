import visualConfig from './gameVisualConfig.json';

export const OFFICIAL_GAME_VISUAL_CONFIG = Object.freeze({
  desktop: Object.freeze({ ...visualConfig.desktop }),
  mobilePortrait: Object.freeze({ ...visualConfig.mobilePortrait }),
  mobileLandscape: Object.freeze({ ...visualConfig.mobileLandscape }),
});

export function getGameVisualConfig({ isLandscape = false, isMobile = false } = {}) {
  if (!isMobile) return OFFICIAL_GAME_VISUAL_CONFIG.desktop;

  return isLandscape
    ? OFFICIAL_GAME_VISUAL_CONFIG.mobileLandscape
    : OFFICIAL_GAME_VISUAL_CONFIG.mobilePortrait;
}
