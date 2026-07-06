import { apiRequest } from './apiClient.js';
import { withAuthRetry } from './authService.js';

export function getLobbies() {
  return withAuthRetry(() => apiRequest('/lobby', { auth: true }));
}

export function createLobby({ gameType, lifes, powerDeckId } = {}) {
  const body = {
    ...(gameType ? { game_type: gameType } : {}),
    ...(lifes === undefined || lifes === null ? {} : { lifes }),
    ...(powerDeckId ? { power_deck_id: powerDeckId } : {}),
  };

  return withAuthRetry(() =>
    apiRequest('/lobby', {
      auth: true,
      method: 'POST',
      body: Object.keys(body).length ? body : undefined,
    }),
  );
}

export function joinLobby(lobbyId) {
  return withAuthRetry(() =>
    apiRequest(`/lobby/${encodeURIComponent(lobbyId)}`, {
      auth: true,
      method: 'PUT',
    }),
  );
}

export const lobbyService = {
  createLobby,
  getLobbies,
  joinLobby,
};
