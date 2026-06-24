import { apiRequest } from './apiClient.js';

export function getLobbies() {
  return apiRequest('/lobby', { auth: true });
}

export function createLobby({ lifes } = {}) {
  return apiRequest('/lobby', {
    auth: true,
    method: 'POST',
    body: lifes === undefined || lifes === null ? undefined : { lifes },
  });
}

export function joinLobby(lobbyId) {
  return apiRequest(`/lobby/${encodeURIComponent(lobbyId)}`, {
    auth: true,
    method: 'PUT',
  });
}

export const lobbyService = {
  createLobby,
  getLobbies,
  joinLobby,
};
