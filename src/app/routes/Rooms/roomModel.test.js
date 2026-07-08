import { describe, expect, it } from 'vitest';
import { normalizeRoom, normalizeRooms } from './roomModel.js';

describe('room view model', () => {
  it('normalizes the current lobby contract', () => {
    expect(normalizeRoom({ lobby_id: 'room-1', players: 2, capacity: 13, state: 'Waiting' })).toEqual({
      capacity: 13,
      id: 'room-1',
      players: 2,
      state: 'Waiting',
    });
  });

  it('supports legacy player arrays and removes entries without ids', () => {
    expect(normalizeRooms([{ id: 'legacy', players: [{}, {}] }, { players: 1 }])).toEqual([
      { capacity: 13, id: 'legacy', players: 2, state: 'Waiting' },
    ]);
  });
});
