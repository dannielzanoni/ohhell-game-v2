import { useEffect, useMemo, useRef } from 'react';
import { getAuthToken } from '@/services/apiClient.js';
import { isMissingAuthTokenError } from '@/services/authService.js';
import {
  createGameSession,
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
import { createRoomEntryGateController } from './roomEntryGateController.js';
import { createReadyController } from './readyController.js';
import { copyText } from '@/infrastructure/browser/clipboard.js';
import { getRoomInviteLink, shareRoomInvite } from './roomInvite.js';
import { getOnlineStatus, subscribeConnectivity } from '@/infrastructure/browser/connectivity.js';

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
  const sessionRef = useRef(null);
  if (!sessionRef.current) sessionRef.current = createGameSession();
  const roomEntryGateRef = useRef(null);
  if (!roomEntryGateRef.current) {
    roomEntryGateRef.current = createRoomEntryGateController({ getAuthToken });
  }
  const readyRef = useRef(null);
  if (!readyRef.current) readyRef.current = createReadyController({ send: setPlayerReady });

  useEffect(() => () => sessionRef.current?.dispose(), []);

  return useMemo(
    () => ({
      createGameSocket: (options) => sessionRef.current.connect(options),
      confirmRoomEntry: (options) => roomEntryGateRef.current.confirm(options),
      copyText,
      getAuthToken,
      getCurrentPlayerId: decodeCurrentPlayerId,
      getGamePreferences,
      getOnlineStatus,
      getRoomInviteLink,
      isMissingAuthTokenError,
      joinLobby,
      playTurn,
      putBid,
      sendReady: (options) => readyRef.current.toggle(options),
      shareRoomInvite,
      settleReady: () => readyRef.current.settle(),
      subscribeConnectivity,
      subscribeToGamePreferences,
    }),
    [],
  );
}
