import { describe, expect, it } from 'vitest';
import { getRoomInviteLink } from './roomInvite.js';

describe('room invite link', () => {
  it('uses the current origin and canonical encoded route', () => {
    expect(getRoomInviteLink('room / 42', { location: { origin: 'https://play.example.test' } }))
      .toBe('https://play.example.test/game/room%20%2F%2042');
  });
});
