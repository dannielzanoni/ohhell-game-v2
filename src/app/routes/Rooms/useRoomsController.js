import { useCallback, useEffect, useState } from 'react';
import { getLobbies } from '@/services/lobbyService.js';

export function useRoomsController() {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lobbies, setLobbies] = useState([]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getLobbies();
      setLobbies(Array.isArray(response) ? response : []);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { error, isLoading, lobbies, refresh };
}
