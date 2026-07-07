// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getLeaderboard } from '@/services/statsService.js';
import { useLeaderboardController } from './useLeaderboardController.js';

vi.mock('@/services/statsService.js', () => ({ getLeaderboard: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const entry = (id) => ({
  player_id: id,
  player: { type: 'Anonymous', data: { id, data: { nickname: id } } },
  games_played: 1,
  matches_won: 1,
  rounds_won: 1,
  win_rate: 100,
});

describe('useLeaderboardController states', () => {
  it('models loading, success, empty and error states in the controller', async () => {
    getLeaderboard.mockResolvedValueOnce([entry('alice')]);
    const { result } = renderHook(() => useLeaderboardController());

    expect(result.current.status).toBe('initial-loading');
    expect(result.current.isInitialLoading).toBe(true);
    expect(getLeaderboard).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100, signal: expect.any(AbortSignal) }),
    );

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.leaderboard).toEqual([entry('alice')]);

    getLeaderboard.mockResolvedValueOnce([]);
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.status).toBe('empty');
    expect(result.current.leaderboard).toEqual([]);

    const error = new Error('ranking unavailable');
    getLeaderboard.mockRejectedValueOnce(error);
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe(error);
  });

  it('preserves previous data while refresh is pending and after refresh errors', async () => {
    getLeaderboard.mockResolvedValueOnce([entry('alice')]);
    const { result } = renderHook(() => useLeaderboardController());
    await waitFor(() => expect(result.current.status).toBe('ready'));

    let rejectRefresh;
    getLeaderboard.mockImplementationOnce(
      () => new Promise((_resolve, reject) => { rejectRefresh = reject; }),
    );

    let refreshPromise;
    act(() => {
      refreshPromise = result.current.refresh();
    });

    expect(result.current.status).toBe('refreshing');
    expect(result.current.isRefreshing).toBe(true);
    expect(result.current.leaderboard).toEqual([entry('alice')]);

    const error = new Error('refresh failed');
    await act(async () => {
      rejectRefresh(error);
      await refreshPromise;
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe(error);
    expect(result.current.leaderboard).toEqual([entry('alice')]);
  });

  it('limits the ranking to 100 positions and aborts the active request on unmount', async () => {
    let signal;
    getLeaderboard.mockImplementationOnce(({ signal: requestSignal }) => {
      signal = requestSignal;
      return new Promise(() => {});
    });

    const { unmount } = renderHook(() => useLeaderboardController());
    expect(signal.aborted).toBe(false);
    unmount();
    expect(signal.aborted).toBe(true);

    getLeaderboard.mockResolvedValueOnce(
      Array.from({ length: 120 }, (_, index) => entry(`player-${index}`)),
    );
    const { result } = renderHook(() => useLeaderboardController());
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.leaderboard).toHaveLength(100);
  });
});
