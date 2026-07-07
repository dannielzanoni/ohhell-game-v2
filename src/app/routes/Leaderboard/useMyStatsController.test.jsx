// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getMyStats } from '@/services/statsService.js';
import { useMyStatsController } from './useMyStatsController.js';

vi.mock('@/services/statsService.js', () => ({ getMyStats: vi.fn() }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('useMyStatsController', () => {
  it('stays disabled and does not call stats/me while the feature flag is off', () => {
    const { result } = renderHook(() => useMyStatsController({ enabled: false }));

    expect(result.current.status).toBe('disabled');
    expect(result.current.stats).toBeNull();
    expect(getMyStats).not.toHaveBeenCalled();
  });

  it('calls stats/me when enabled and treats null as an empty state', async () => {
    getMyStats.mockResolvedValueOnce(null);
    const { result } = renderHook(() => useMyStatsController({ enabled: true }));

    expect(result.current.status).toBe('initial-loading');
    await waitFor(() => expect(result.current.status).toBe('empty'));
    expect(result.current.stats).toBeNull();
    expect(getMyStats).toHaveBeenCalledWith({
      signal: expect.any(AbortSignal),
    });
  });

  it('exposes authenticated stats and errors without touching the global ranking', async () => {
    const stats = { games_played: 3, matches_won: 2, win_rate: 66.6 };
    getMyStats.mockResolvedValueOnce(stats);
    const { result } = renderHook(() => useMyStatsController({ enabled: true }));

    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current.stats).toBe(stats);

    const error = new Error('stats unavailable');
    getMyStats.mockRejectedValueOnce(error);
    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe(error);
  });
});
