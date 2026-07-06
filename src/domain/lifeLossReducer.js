export function reduceLifeLossEvents(previousPlayers, lifesByPlayer) {
  return Object.entries(lifesByPlayer || {}).flatMap(([playerId, currentLifes]) => {
    const previousLifes = Number(previousPlayers?.[playerId]?.lifes ?? currentLifes);
    const nextLifes = Number(currentLifes);
    const lost = previousLifes - nextLifes;

    return Number.isFinite(lost) && lost > 0
      ? [{ lost, nextLifes, playerId, previousLifes }]
      : [];
  });
}
