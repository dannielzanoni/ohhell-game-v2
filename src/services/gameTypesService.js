export const gameTypes = {
  FODINHA_CLASSIC: 'fodinha_classic',
  FODINHA_POWER: 'fodinha_power',
};

export const gameTypeOptions = [
  {
    descriptionKey: 'gameTypes.fodinhaClassicDescription',
    labelKey: 'gameTypes.fodinhaClassic',
    value: gameTypes.FODINHA_CLASSIC,
  },
  {
    descriptionKey: 'gameTypes.fodinhaPowerDescription',
    labelKey: 'gameTypes.fodinhaPower',
    value: gameTypes.FODINHA_POWER,
  },
];

const SELECTED_GAME_TYPE_STORAGE_KEY = 'fodinha_selected_game_type';

function canUseStorage() {
  return typeof window !== 'undefined' && window.localStorage;
}

export function getGameTypeOption(value) {
  return gameTypeOptions.find((option) => option.value === value) || null;
}

export function getSelectedGameType() {
  if (!canUseStorage()) {
    return null;
  }

  const stored = localStorage.getItem(SELECTED_GAME_TYPE_STORAGE_KEY);

  return getGameTypeOption(stored)?.value || null;
}

export function setSelectedGameType(gameType) {
  if (!canUseStorage()) {
    return null;
  }

  const option = getGameTypeOption(gameType);

  if (!option) {
    localStorage.removeItem(SELECTED_GAME_TYPE_STORAGE_KEY);
    return null;
  }

  localStorage.setItem(SELECTED_GAME_TYPE_STORAGE_KEY, option.value);
  return option.value;
}
