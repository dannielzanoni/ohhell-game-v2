import { describe, expect, it, vi } from 'vitest';
import { createRoomEntryGateController } from './roomEntryGateController.js';

describe('room entry gate controller', () => {
  it('waits for profile persistence before one PUT and one socket connection', async () => {
    let resolveProfile;
    const persistProfile = vi.fn(() => new Promise((resolve) => { resolveProfile = resolve; }));
    const joinLobby = vi.fn().mockResolvedValue({ lobby_id: 'room-1' });
    const connectSocket = vi.fn();
    const onConfirmed = vi.fn(async () => {
      await joinLobby('room-1');
      connectSocket();
    });
    const gate = createRoomEntryGateController({ getAuthToken: () => 'stored-token' });

    const first = gate.confirm({ persistProfile, onConfirmed });
    const repeated = gate.confirm({ persistProfile, onConfirmed });
    expect(persistProfile).toHaveBeenCalledOnce();
    expect(joinLobby).not.toHaveBeenCalled();

    resolveProfile({ token: 'saved-token' });
    await Promise.all([first, repeated]);
    expect(onConfirmed).toHaveBeenCalledOnce();
    expect(joinLobby).toHaveBeenCalledOnce();
    expect(connectSocket).toHaveBeenCalledOnce();
  });

  it('allows a retry after persistence fails', async () => {
    const persistProfile = vi.fn()
      .mockRejectedValueOnce(new Error('save failed'))
      .mockResolvedValueOnce({ token: 'saved-token' });
    const onConfirmed = vi.fn();
    const gate = createRoomEntryGateController({ getAuthToken: () => null });

    await expect(gate.confirm({ persistProfile, onConfirmed })).rejects.toThrow('save failed');
    await expect(gate.confirm({ persistProfile, onConfirmed })).resolves.toMatchObject({ token: 'saved-token' });
    expect(persistProfile).toHaveBeenCalledTimes(2);
    expect(onConfirmed).toHaveBeenCalledOnce();
  });
});
