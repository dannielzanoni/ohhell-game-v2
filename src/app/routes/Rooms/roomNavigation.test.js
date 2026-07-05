import { describe, expect, it } from 'vitest';
import { joinRoomErrorKey, roomDestination } from './roomNavigation.js';

describe('room navigation', () => {
  it('builds a canonical encoded game route', () => {
    expect(roomDestination('room / 42')).toBe('/game/room%20%2F%2042');
  });

  it.each([
    [404, 'game.roomNotFound'],
    [409, 'game.roomConflict'],
    [403, 'game.roomForbidden'],
    [500, 'game.enterRoomError'],
  ])('maps status %s to an actionable message key', (status, key) => {
    expect(joinRoomErrorKey({ status })).toBe(key);
  });
});
