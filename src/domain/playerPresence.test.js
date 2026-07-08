import { describe, expect, it } from 'vitest';
import { MAX_LOBBY_PLAYERS, reducePlayerPresence } from './playerPresence.js';

describe('player presence reducer', () => {
  it('adds, updates without duplication and removes through one reducer', () => {
    const joined = reducePlayerPresence({}, {
      type: 'PlayerJoined',
      player: { id: 'player-1', nickname: 'Ada', ready: false },
    });
    const updated = reducePlayerPresence(joined, {
      type: 'PlayerJoined',
      player: { id: 'player-1', nickname: 'Ada Lovelace', ready: true },
    });
    expect(Object.keys(updated)).toEqual(['player-1']);
    expect(updated['player-1']).toMatchObject({ nickname: 'Ada Lovelace', ready: true });
    expect(reducePlayerPresence(updated, { type: 'PlayerLeft', playerId: 'player-1' })).toEqual({});
  });

  it('aligns the visual/product maximum to thirteen', () => {
    expect(MAX_LOBBY_PLAYERS).toBe(13);
    let players = {};
    for (let index = 1; index <= 14; index += 1) {
      players = reducePlayerPresence(players, {
        type: 'PlayerJoined',
        player: { id: `player-${index}` },
      });
    }
    expect(Object.keys(players)).toHaveLength(13);
  });
});
