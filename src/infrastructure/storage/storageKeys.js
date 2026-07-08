export const storageKeys = Object.freeze({
  authToken: 'JWT_TOKEN',
  cardPreferences: 'ohhell_game_preferences',
  guestAvatar: 'ohhell_guest_avatar_id',
  guestNickname: 'ohhell_guest_nickname',
  language: 'ohhell_language',
  navCollapsed: 'ohhell_nav_collapsed',
  refreshToken: 'REFRESH_TOKEN',
  theme: 'ohhell_theme',
});

export const legacyStorageKeys = Object.freeze({
  authToken: 'ohhell_auth_token',
  theme: 'theme',
});

export function lobbyLivesStorageKey(lobbyId) {
  return `ohhell_lobby_lifes_${lobbyId}`;
}
