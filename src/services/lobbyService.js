import { apiRequest } from './apiClient.js';
import { withAuthRetry } from './authService.js';

export function getLobbies() {
  return withAuthRetry(() => apiRequest('/lobby', { auth: true }));
}

export function createLobby({ lifes } = {}) {
  return withAuthRetry(() =>
    apiRequest('/lobby', {
      auth: true,
      method: 'POST',
      body: lifes === undefined || lifes === null ? undefined : { lifes },
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
