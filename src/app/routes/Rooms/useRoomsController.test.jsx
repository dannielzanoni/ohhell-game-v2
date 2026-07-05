// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getLobbies } from '@/services/lobbyService.js';
import { useRoomsController } from './useRoomsController.js';

vi.mock('@/services/lobbyService.js', () => ({ getLobbies: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('useRoomsController states', () => {
  it('distinguishes initial loading and refresh while preserving valid data', async () => {
    getLobbies.mockResolvedValueOnce([{ lobby_id: 'room-1', players: 2, capacity: 13, state: 'Waiting' }]);
    const { result } = renderHook(() => useRoomsController());
    expect(result.current.status).toBe('initial-loading');
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.lobbies).toHaveLength(1);

    let rejectRefresh;
    getLobbies.mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectRefresh = reject; }));
    let refreshPromise;
    act(() => { refreshPromise = result.current.refresh(); });
    expect(result.current.status).toBe('refreshing');
    expect(result.current.lobbies).toHaveLength(1);

    await act(async () => {
      rejectRefresh(new Error('refresh failed'));
      await refreshPromise;
    });
    expect(result.current.status).toBe('error');
    expect(result.current.lobbies).toHaveLength(1);
  });

  it('aborts the active request when leaving the route', () => {
    let signal;
    getLobbies.mockImplementationOnce(({ signal: requestSignal }) => {
      signal = requestSignal;
      return new Promise(() => {});
    });
    const { unmount } = renderHook(() => useRoomsController());
    expect(signal.aborted).toBe(false);
    unmount();
    expect(signal.aborted).toBe(true);
  });
});
