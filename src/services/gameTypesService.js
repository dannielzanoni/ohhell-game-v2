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

export function getGameTypeOption(value) {
  return gameTypeOptions.find((option) => option.value === value) || null;
}
