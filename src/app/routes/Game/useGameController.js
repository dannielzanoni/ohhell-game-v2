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
import { createGameStateController } from '@/domain/gameStateReducer.js';
import { createAudioAdapter } from '@/infrastructure/browser/audio.js';

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
  const gameStateRef = useRef(null);
  if (!gameStateRef.current) gameStateRef.current = createGameStateController();
  const audioRef = useRef(null);
  if (!audioRef.current) audioRef.current = createAudioAdapter();

  useEffect(() => () => sessionRef.current?.dispose(), []);

  return useMemo(
    () => ({
      createGameSocket: (options) => sessionRef.current.connect(options),
      clearSoundSlot: (slot) => audioRef.current.clearSlot(slot),
      confirmRoomEntry: (options) => roomEntryGateRef.current.confirm(options),
      consumeGameMessage: (message) => gameStateRef.current.consume(message),
      copyText,
      getAuthToken,
      getCurrentPlayerId: decodeCurrentPlayerId,
      getGamePreferences,
      getGameState: () => gameStateRef.current.getState(),
      getOnlineStatus,
      getRoomInviteLink,
      isMissingAuthTokenError,
      joinLobby,
      playTurn,
      playSound: (src, volume) => audioRef.current.play(src, volume),
      playSoundOnce: (slot, eventId, src, volume) => audioRef.current.playOnce(slot, eventId, src, volume),
      putBid,
      sendReady: (options) => readyRef.current.toggle(options),
      shareRoomInvite,
      settleReady: () => readyRef.current.settle(),
      subscribeConnectivity,
      subscribeGameState: (subscriber) => gameStateRef.current.subscribe(subscriber),
      subscribeToGamePreferences,
    }),
    [],
  );
}
