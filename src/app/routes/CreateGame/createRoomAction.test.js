import { describe, expect, it, vi } from 'vitest';
import { createRoomAction } from './createRoomAction.js';

describe('createRoomAction', () => {
  it('collapses repeated submits and navigates to the canonical game route', async () => {
    let resolveLobby;
    const createLobby = vi.fn(() => new Promise((resolve) => { resolveLobby = resolve; }));
    const navigate = vi.fn();
    const storage = { setItem: vi.fn() };
    const action = createRoomAction({ createLobby, navigate, storage });

    const first = action.execute({ lives: '5' });
    const repeated = action.execute({ lives: '5' });
    expect(createLobby).toHaveBeenCalledOnce();
    expect(createLobby).toHaveBeenCalledWith({ lifes: 5 });

    resolveLobby({ lobby_id: 'room / 42' });
    await Promise.all([first, repeated]);
    expect(storage.setItem).toHaveBeenCalledWith('ohhell_lobby_lifes_room / 42', 5);
    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith('/game/room%20%2F%2042', { state: { lifes: 5 } });
  });

  it('releases the lock after an error so the user can retry', async () => {
    const createLobby = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce({ lobby_id: 'retry-room' });
    const action = createRoomAction({ createLobby, navigate: vi.fn(), storage: { setItem: vi.fn() } });

    await expect(action.execute({ lives: 3 })).rejects.toThrow('offline');
    await expect(action.execute({ lives: 3 })).resolves.toMatchObject({ lobby_id: 'retry-room' });
    expect(createLobby).toHaveBeenCalledTimes(2);
  });
});
