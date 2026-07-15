export const HELL_HAND_PATHS = Object.freeze({
  CREATE_GAME: '/hell-hand/create-game',
  HOW_TO_PLAY: '/hell-hand/how-to-play',
  MERCENARIES: '/hell-hand/mercenaries',
  ROOT: '/hell-hand',
  ROOMS: '/hell-hand/rooms',
  game: (lobbyId) => `/hell-hand/game/${encodeURIComponent(lobbyId)}`,
  mercenary: (mercenaryId) =>
    `/hell-hand/mercenaries/${encodeURIComponent(mercenaryId)}`,
});
