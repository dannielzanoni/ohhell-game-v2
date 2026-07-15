export const GAME_MODULE_IDS = {
  CLASSIC: 'classic',
  HELL_HAND: 'hell_hand',
};

export const GAME_TYPES = {
  CLASSIC: 'fodinha_classic',
  HELL_HAND: 'fodinha_power',
};

export const gameTypeOptions = [
  {
    descriptionKey: 'gameTypes.fodinhaClassicDescription',
    labelKey: 'gameTypes.fodinhaClassic',
    moduleId: GAME_MODULE_IDS.CLASSIC,
    value: GAME_TYPES.CLASSIC,
  },
  {
    descriptionKey: 'gameTypes.fodinhaPowerDescription',
    labelKey: 'gameTypes.fodinhaPower',
    moduleId: GAME_MODULE_IDS.HELL_HAND,
    value: GAME_TYPES.HELL_HAND,
  },
];

export function getGameTypeOption(value) {
  return gameTypeOptions.find((option) => option.value === value) || null;
}
