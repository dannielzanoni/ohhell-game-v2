import { apiRequest } from './apiClient.js';
import { withGuestAuthRetry } from './authService.js';

export function getLobbies({ signal } = {}) {
  return withGuestAuthRetry(() => apiRequest('/lobby', { auth: true, signal }));
}

export function createLobby({ lifes } = {}) {
  return withGuestAuthRetry(() =>
    apiRequest('/lobby', {
      auth: true,
      method: 'POST',
      body: lifes === undefined || lifes === null ? undefined : { lifes },
    }),
  );
}

export function joinLobby(lobbyId) {
  return withGuestAuthRetry(() =>
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
