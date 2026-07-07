import { useCallback, useEffect, useRef, useState } from 'react';
import { getLeaderboard } from '@/services/statsService.js';

export function useLeaderboardController() {
  const [error, setError] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [status, setStatus] = useState('initial-loading');
  const abortRef = useRef(null);
  const hasLoadedRef = useRef(false);

  const refresh = useCallback(async () => {
    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;

    setStatus(hasLoadedRef.current ? 'refreshing' : 'initial-loading');
    setError(null);

    try {
      const response = await getLeaderboard({
        limit: 100,
        signal: abortController.signal,
      });
      if (abortController.signal.aborted) return;

      const nextLeaderboard = Array.isArray(response) ? response.slice(0, 100) : [];
      hasLoadedRef.current = true;
      setLeaderboard(nextLeaderboard);
      setStatus(nextLeaderboard.length ? 'ready' : 'empty');
    } catch (requestError) {
      if (abortController.signal.aborted || requestError?.data?.code === 'ABORTED') return;
      hasLoadedRef.current = true;
      setError(requestError);
      setStatus('error');
    } finally {
      if (abortRef.current === abortController) abortRef.current = null;
    }
  }, []);

  useEffect(() => {
    void refresh();
    return () => abortRef.current?.abort();
  }, [refresh]);

  return {
    error,
    isInitialLoading: status === 'initial-loading',
    isLoading: status === 'initial-loading' || status === 'refreshing',
    isRefreshing: status === 'refreshing',
    leaderboard,
    refresh,
    status,
  };
}
