import { useCallback, useEffect, useState } from 'react';
import { getLeaderboard } from '@/services/statsService.js';

export function useLeaderboardController() {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getLeaderboard({ limit: 100 });
      setLeaderboard(Array.isArray(response) ? response : []);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { error, isLoading, leaderboard, refresh };
}
