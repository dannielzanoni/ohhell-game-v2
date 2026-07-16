import { getClassicCardKey } from '@/games/classic/assets/cardAssetRegistry.js';

export function getTurnAnimationKey(turn) {
  return `${turn?.player_id || ''}:${getClassicCardKey(turn?.card)}`;
}

export function getAddedTurn(previousPile, nextPile) {
  const previousCounts = (previousPile || []).reduce((counts, turn) => {
    const key = getTurnAnimationKey(turn);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});

  return (nextPile || []).find((turn) => {
    const key = getTurnAnimationKey(turn);
    const remainingCount = previousCounts[key] || 0;

    if (remainingCount) {
      previousCounts[key] = remainingCount - 1;
      return false;
    }

    return true;
  });
}
