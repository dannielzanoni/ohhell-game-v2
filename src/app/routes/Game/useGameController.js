import { useMemo } from 'react';
import { getAuthToken } from '@/services/apiClient.js';
import { isMissingAuthTokenError } from '@/services/authService.js';
import {
  createGameSocket,
  playTurn,
  putBid,
  setPlayerReady,
} from '@/services/gameSocketService.js';
import {
  deckTypes,
  getGamePreferences,
  subscribeToGamePreferences,
} from '@/services/gamePreferencesService.js';
import { joinLobby } from '@/services/lobbyService.js';

export function decodeCurrentPlayerId(token = getAuthToken()) {
  if (!token) return null;

  try {
    const encoded = token.split('.')[1];
    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '=',
    );
    const payload = JSON.parse(atob(padded));
    return payload?.id || payload?.email || null;
  } catch {
    return null;
  }
}

export { deckTypes };

export function useGameController() {
  return useMemo(
    () => ({
      createGameSocket,
      getAuthToken,
      getCurrentPlayerId: decodeCurrentPlayerId,
      getGamePreferences,
      isMissingAuthTokenError,
      joinLobby,
      playTurn,
      putBid,
      setPlayerReady,
      subscribeToGamePreferences,
    }),
    [],
  );
}
