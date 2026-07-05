export const MAX_LOBBY_PLAYERS = 13;

export function reducePlayerPresence(players, event) {
  const current = players || {};

  if (event?.type === 'PlayerJoined' && event.player?.id) {
    const exists = Boolean(current[event.player.id]);
    if (!exists && Object.keys(current).length >= MAX_LOBBY_PLAYERS) return current;
    return {
      ...current,
      [event.player.id]: {
        ...current[event.player.id],
        ...event.player,
      },
    };
  }

  if (event?.type === 'PlayerLeft' && event.playerId && current[event.playerId]) {
    const next = { ...current };
    delete next[event.playerId];
    return next;
  }

  return current;
}
