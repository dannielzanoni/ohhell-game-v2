import { environment } from '@/config/environment.js';
import { getAuthToken } from './apiClient.js';

const CONNECTING = 0;
const OPEN = 1;
const CLOSING = 2;
const CLOSED = 3;

export function getGameSocketUrl(token = getAuthToken()) {
  if (!token) {
    throw new Error('Missing auth token');
  }

  const url = new URL(environment.websocketUrl);
  url.searchParams.set('token', token);

  return url.toString();
}

export class GameRealtimeSession {
  constructor({ Socket = globalThis.WebSocket, urlFactory = getGameSocketUrl } = {}) {
    this.Socket = Socket;
    this.urlFactory = urlFactory;
    this.socket = null;
    this.pending = [];
    this.handlers = {};
    this.disposed = false;
  }

  get readyState() {
    return this.socket?.readyState ?? CLOSED;
  }

  connect({ onClose, onError, onMessage, onOpen, token = getAuthToken() } = {}) {
    if (this.disposed) throw new Error('Realtime session is disposed');
    this.handlers = { onClose, onError, onMessage, onOpen };

    if (this.socket && [CONNECTING, OPEN].includes(this.socket.readyState)) {
      return this;
    }
    if (!this.Socket) throw new Error('WebSocket is unavailable');

    const socket = new this.Socket(this.urlFactory(token));
    this.socket = socket;
    socket.addEventListener('open', (event) => {
      if (this.socket !== socket || this.disposed) return;
      this.pending.splice(0).forEach((payload) => socket.send(payload));
      this.handlers.onOpen?.(event);
    });
    socket.addEventListener('message', (event) => {
      if (this.socket !== socket || this.disposed) return;
      try {
        this.handlers.onMessage?.(JSON.parse(event.data), event);
      } catch (error) {
        this.handlers.onError?.(error);
      }
    });
    socket.addEventListener('error', (event) => {
      if (this.socket === socket && !this.disposed) this.handlers.onError?.(event);
    });
    socket.addEventListener('close', (event) => {
      if (this.socket !== socket) return;
      this.socket = null;
      if (!this.disposed) this.handlers.onClose?.(event);
    });

    return this;
  }

  send(payload) {
    if (this.disposed) throw new Error('Realtime session is disposed');
    if (this.readyState === CONNECTING) {
      this.pending.push(payload);
      return;
    }
    if (this.readyState !== OPEN) throw new Error('WebSocket is not open');
    this.socket.send(payload);
  }

  close(code, reason) {
    this.pending = [];
    if (this.socket && this.socket.readyState < CLOSING) {
      this.socket.close(code, reason);
    }
  }

  dispose() {
    this.disposed = true;
    this.handlers = {};
    this.close(1000, 'route-unmounted');
    this.socket = null;
  }
}

export function createGameSession(options) {
  return new GameRealtimeSession(options);
}

export function createGameSocket(options) {
  return createGameSession().connect(options);
}

export function sendGameCommand(socket, command) {
  if (!socket) {
    throw new Error('WebSocket is not open');
  }

  if (![CONNECTING, OPEN].includes(socket.readyState)) {
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
  createGameSession,
  getGameSocketUrl,
  playTurn,
  putBid,
  sendGameCommand,
  setPlayerReady,
};
