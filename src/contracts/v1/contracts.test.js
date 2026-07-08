import { describe, expect, it } from 'vitest';
import {
  clientCommandTypes,
  httpContract,
  parseRealtimeMessage,
  realtimeClientContract,
  realtimeServerContract,
  serializeRealtimeCommand,
  serverMessageTypes,
} from './contracts.js';

describe('versioned HTTP and realtime contracts', () => {
  it('has a fixture for every frontend HTTP endpoint', () => {
    expect(httpContract.map(({ id }) => id)).toEqual([
      'auth.signup', 'auth.profile', 'auth.google', 'auth.refresh',
      'lobby.list', 'lobby.create', 'lobby.join', 'stats.global', 'stats.me',
    ]);
    expect(new Set(httpContract.map(({ id }) => id)).size).toBe(httpContract.length);
  });

  it('covers all 14 server message types exactly once', () => {
    const fixtureTypes = realtimeServerContract.map(({ type }) => type);
    expect(fixtureTypes).toEqual(serverMessageTypes);
    expect(new Set(fixtureTypes).size).toBe(14);
  });

  it('covers and serializes every client command', () => {
    expect(realtimeClientContract.map(({ type }) => type)).toEqual(clientCommandTypes);
    realtimeClientContract.forEach((fixture) => {
      expect(JSON.parse(serializeRealtimeCommand(fixture))).toEqual(fixture);
    });
  });

  it('parses every server fixture and rejects drift', () => {
    realtimeServerContract.forEach((fixture) => {
      expect(parseRealtimeMessage(JSON.stringify(fixture))).toEqual(fixture);
    });
    expect(() => parseRealtimeMessage({ type: 'NewUnversionedType', data: {} }))
      .toThrow('Unknown realtime message type');
  });
});
