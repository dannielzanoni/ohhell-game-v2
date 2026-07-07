import { useCallback, useEffect, useRef, useState } from 'react';
import { getMyStats } from '@/services/statsService.js';

export function useMyStatsController({ enabled = false } = {}) {
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState(enabled ? 'initial-loading' : 'disabled');
  const abortRef = useRef(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setStatus('disabled');
      setError(null);
      setStats(null);
      return;
    }

    abortRef.current?.abort();
    const abortController = new AbortController();
    abortRef.current = abortController;
    setStatus('initial-loading');
    setError(null);

    try {
      const response = await getMyStats({ signal: abortController.signal });
      if (abortController.signal.aborted) return;

      setStats(response || null);
      setStatus(response ? 'ready' : 'empty');
    } catch (requestError) {
      if (abortController.signal.aborted || requestError?.data?.code === 'ABORTED') return;
      setError(requestError);
      setStats(null);
      setStatus('error');
    } finally {
      if (abortRef.current === abortController) abortRef.current = null;
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
    return () => abortRef.current?.abort();
  }, [refresh]);

  return {
    enabled,
    error,
    isLoading: status === 'initial-loading',
    refresh,
    stats,
    status,
  };
}
