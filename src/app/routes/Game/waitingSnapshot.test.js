import { describe, expect, it } from 'vitest';
import { getSnapshotStatusMap, normalizeStatusMap } from './GameView.jsx';

describe('initial Waiting snapshot', () => {
  it('reads the current Snapshot.status contract', () => {
    const status = { 'player-1': { ready: false } };
    expect(getSnapshotStatusMap({ type: 'Waiting', status })).toBe(status);
  });

  it('replaces speculative players and hydrates identity plus ready state', () => {
    const authoritative = normalizeStatusMap({
      'player-1': {
        ready: true,
        player: {
          type: 'Anonymous',
          data: {
            id: 'player-1',
            data: { nickname: 'Ada', picture: 'avatar-1' },
          },
        },
      },
    }, 5, {
      speculative: { id: 'speculative', nickname: 'Temporary', ready: false },
    });

    expect(Object.keys(authoritative)).toEqual(['player-1']);
    expect(authoritative['player-1']).toMatchObject({
      avatarSrc: 'avatar-1',
      nickname: 'Ada',
      ready: true,
    });
  });
});
