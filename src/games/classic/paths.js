export const CLASSIC_PATHS = Object.freeze({
  CREATE_GAME: '/classic/create-game',
  GITHUB: '/classic/github',
  HOW_TO_PLAY: '/classic/how-to-play',
  LEADERBOARD: '/classic/leaderboard',
  ROOT: '/classic',
  ROOMS: '/classic/rooms',
  SETTINGS: '/classic/settings',
  game: (lobbyId) => `/classic/game/${encodeURIComponent(lobbyId)}`,
});
