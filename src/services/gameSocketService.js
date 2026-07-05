import { environment } from '@/config/environment.js';
import { getAuthToken } from './apiClient.js';

const pendingCommandsBySocket = new WeakMap();
export const WAITING_LOBBY_INACTIVITY_CLOSE_CODE = 4001;

export function isWaitingLobbyInactiveClose(event) {
  return event?.code === WAITING_LOBBY_INACTIVITY_CLOSE_CODE;
}

export function getGameSocketUrl(token = getAuthToken()) {
  if (!token) {
    throw new Error('Missing auth token');
  }

  const url = new URL(environment.websocketUrl);
  url.searchParams.set('token', token);

  return url.toString();
}

export function createGameSocket({
  onClose,
  onError,
  onMessage,
  onOpen,
  token = getAuthToken(),
} = {}) {
  const socket = new WebSocket(getGameSocketUrl(token));

  socket.addEventListener('open', (event) => {
    const pendingCommands = pendingCommandsBySocket.get(socket) || [];

    pendingCommands.forEach((command) => {
      socket.send(JSON.stringify(command));
    });
    pendingCommandsBySocket.delete(socket);

    onOpen?.(event);
  });

  socket.addEventListener('message', (event) => {
    const message = JSON.parse(event.data);
    onMessage?.(message, event);
  });

  socket.addEventListener('error', (event) => {
    onError?.(event);
  });

  socket.addEventListener('close', (event) => {
    onClose?.(event);
  });

  return socket;
}

export function sendGameCommand(socket, command) {
  if (!socket) {
    throw new Error('WebSocket is not open');
  }

  if (socket.readyState === WebSocket.CONNECTING) {
    const pendingCommands = pendingCommandsBySocket.get(socket) || [];
    pendingCommands.push(command);
    pendingCommandsBySocket.set(socket, pendingCommands);
    return;
  }

  if (socket.readyState !== WebSocket.OPEN) {
    throw new Error('WebSocket is not open');
  }

  socket.send(JSON.stringify(command));
}

export function playTurn(socket, card) {
  sendGameCommand(socket, {
    type: 'PlayTurn',
    data: { card },
  });
}

export function putBid(socket, bid) {
  sendGameCommand(socket, {
    type: 'PutBid',
    data: { bid },
  });
}

export function setPlayerReady(socket, ready) {
  sendGameCommand(socket, {
    type: 'PlayerStatusChange',
    data: { ready },
  });
}

export const gameSocketService = {
  createGameSocket,
  getGameSocketUrl,
  isWaitingLobbyInactiveClose,
  playTurn,
  putBid,
  sendGameCommand,
  setPlayerReady,
};
