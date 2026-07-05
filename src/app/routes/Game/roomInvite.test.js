import { describe, expect, it, vi } from 'vitest';
import { getRoomInviteLink, shareRoomInvite } from './roomInvite.js';

describe('room invite link', () => {
  it('uses the current origin and canonical encoded route', () => {
    expect(getRoomInviteLink('room / 42', { location: { origin: 'https://play.example.test' } }))
      .toBe('https://play.example.test/game/room%20%2F%2042');
  });

  it('uses Web Share when available', async () => {
    const share = vi.fn();
    await expect(shareRoomInvite({ lobbyId: 'room-1', title: 'Invite' }, {
      location: { origin: 'https://play.test' },
      navigator: { share },
    })).resolves.toBe('shared');
    expect(share).toHaveBeenCalledWith({ title: 'Invite', url: 'https://play.test/game/room-1' });
  });

  it('treats share cancellation as a neutral result', async () => {
    const cancellation = new Error('cancelled');
    cancellation.name = 'AbortError';
    await expect(shareRoomInvite({ lobbyId: 'room-1', title: 'Invite' }, {
      location: { origin: 'https://play.test' },
      navigator: { share: vi.fn().mockRejectedValue(cancellation) },
    })).resolves.toBe('cancelled');
  });

  it('copies when Web Share is unavailable', async () => {
    const writeText = vi.fn();
    await expect(shareRoomInvite({ lobbyId: 'room-1', title: 'Invite' }, {
      location: { origin: 'https://play.test' },
      navigator: { clipboard: { writeText } },
    })).resolves.toBe('copied');
    expect(writeText).toHaveBeenCalledWith('https://play.test/game/room-1');
  });
});
