import { environment } from '@/config/environment.js';
import { getAuthToken } from './apiClient.js';

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
  playTurn,
  putBid,
  sendGameCommand,
  setPlayerReady,
};
