import { describe, expect, it, vi } from 'vitest';
import { GameRealtimeSession, sendGameCommand } from './gameSocketService.js';

class FakeSocket {
  static instances = [];
  constructor(url) {
    this.url = url;
    this.readyState = 0;
    this.listeners = new Map();
    this.send = vi.fn();
    this.close = vi.fn(() => { this.readyState = 3; });
    FakeSocket.instances.push(this);
  }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  emit(type, event = {}) { this.listeners.get(type)?.(event); }
}

function createSession() {
  FakeSocket.instances = [];
  return new GameRealtimeSession({
    Socket: FakeSocket,
    urlFactory: () => 'wss://game.test',
  });
}

describe('GameRealtimeSession', () => {
  it('keeps exactly one socket while connecting or open', () => {
    const session = createSession();
    session.connect();
    session.connect();
    FakeSocket.instances[0].readyState = 1;
    session.connect();
    expect(FakeSocket.instances).toHaveLength(1);
  });

  it('queues commands during CONNECTING and flushes in order', () => {
    const session = createSession().connect();
    sendGameCommand(session, { type: 'PutBid', data: { bid: 1 } });
    sendGameCommand(session, { type: 'PlayerStatusChange', data: { ready: true } });
    const socket = FakeSocket.instances[0];
    socket.readyState = 1;
    socket.emit('open');

    expect(socket.send.mock.calls.flat()).toEqual([
      JSON.stringify({ type: 'PutBid', data: { bid: 1 } }),
      JSON.stringify({ type: 'PlayerStatusChange', data: { ready: true } }),
    ]);
  });

  it('parses snapshots through the shared message handler', () => {
    const onMessage = vi.fn();
    createSession().connect({ onMessage });
    FakeSocket.instances[0].emit('message', {
      data: JSON.stringify({ type: 'Snapshot', data: { state: 'Waiting' } }),
    });
    expect(onMessage).toHaveBeenCalledWith(
      { type: 'Snapshot', data: { state: 'Waiting' } },
      expect.any(Object),
    );
  });

  it('does not expose an authenticated socket URL through connection errors', () => {
    const onError = vi.fn();
    createSession().connect({ onError });
    FakeSocket.instances[0].emit('error', {
      target: { url: 'wss://game.test?token=secret-token' },
    });
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({
      code: 'realtime_connection_failed',
      message: 'Realtime connection failed',
    }));
    expect(JSON.stringify(onError.mock.calls)).not.toContain('secret-token');
    expect(JSON.stringify(onError.mock.calls)).not.toContain('wss://');
  });

  it('closes the socket and clears queued commands on dispose', () => {
    const session = createSession().connect();
    sendGameCommand(session, { type: 'PutBid', data: { bid: 1 } });
    const socket = FakeSocket.instances[0];
    session.dispose();

    expect(socket.close).toHaveBeenCalledWith(1000, 'route-unmounted');
    expect(() => session.send('{}')).toThrow('disposed');
  });
});
