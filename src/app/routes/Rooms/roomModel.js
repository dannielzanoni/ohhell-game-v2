export const DEFAULT_ROOM_CAPACITY = 13;

export function normalizeRoom(lobby) {
  const id = String(lobby?.lobby_id || lobby?.id || '');
  const playersValue = lobby?.players ?? lobby?.player_count ?? 0;
  const players = Array.isArray(playersValue) ? playersValue.length : Number(playersValue) || 0;
  const capacity = Number(lobby?.capacity) || DEFAULT_ROOM_CAPACITY;

  return {
    capacity,
    id,
    players,
    state: String(lobby?.state || 'Waiting'),
  };
}

export function normalizeRooms(response) {
  if (!Array.isArray(response)) return [];
  return response.map(normalizeRoom).filter(({ id }) => Boolean(id));
}
