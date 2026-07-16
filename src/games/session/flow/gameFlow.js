export function getRandomItem(items) {
  if (!items?.length) {
    return null;
  }

  return items[Math.floor(Math.random() * items.length)];
}

export function getGamePile(gameInfo) {
  const candidates = [
    gameInfo?.pile,
    gameInfo?.current_pile,
    gameInfo?.stage?.data?.pile,
    gameInfo?.stage?.pile,
  ];

  return candidates.find(Array.isArray);
}

export function getInitialSetCardCount(gameInfo, localPlayerIds = []) {
  if (!Array.isArray(gameInfo?.deck)) {
    return 0;
  }

  const completedRounds = (gameInfo.info || []).reduce(
    (total, player) => total + (Number(player?.rounds) || 0),
    0,
  );
  const currentPile = getGamePile(gameInfo) || [];
  const localPlayerAlreadyPlayed = currentPile.some((turn) =>
    localPlayerIds.includes(turn?.player_id),
  );

  return gameInfo.deck.length + completedRounds + Number(localPlayerAlreadyPlayed);
}

export function orderPlayersClockwise(players, playerOrder, currentPlayerId) {
  const playersById = new Map(players.map((player) => [player.id, player]));
  const orderedPlayers = [];

  playerOrder.forEach((playerId) => {
    const player = playersById.get(playerId);

    if (player) {
      orderedPlayers.push(player);
      playersById.delete(playerId);
    }
  });

  orderedPlayers.push(...playersById.values());

  const currentIndex = orderedPlayers.findIndex((player) => player.id === currentPlayerId);

  if (currentIndex <= 0) {
    return orderedPlayers;
  }

  return [...orderedPlayers.slice(currentIndex), ...orderedPlayers.slice(0, currentIndex)];
}

export function hasPositiveLifes(player, defaultLifes) {
  const playerLifes = Number(player?.lifes ?? defaultLifes);
  return Number.isFinite(playerLifes) ? playerLifes > 0 : true;
}

export function getPlayedCountsByPlayer(pile) {
  return pile.reduce((counts, turn) => {
    counts[turn.player_id] = (counts[turn.player_id] || 0) + 1;
    return counts;
  }, {});
}

export function getSeatCardCount({
  isCurrent,
  playerDeckLength,
  playerId,
  playedCountsByPlayer,
  roundCardCount,
}) {
  if (!roundCardCount) {
    return 0;
  }

  if (isCurrent) {
    return playerDeckLength;
  }

  return Math.max(0, roundCardCount - (playedCountsByPlayer[playerId] || 0));
}
