import { useCallback, useEffect, useState } from 'react';
import { getLobbies } from '@/services/lobbyService.js';
import { normalizeRooms } from './roomModel.js';
import { copyText } from '@/infrastructure/browser/clipboard.js';

export function useRoomsController() {
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lobbies, setLobbies] = useState([]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getLobbies();
      setLobbies(normalizeRooms(response));
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const copyRoomId = useCallback((roomId) => copyText(roomId), []);

  return { copyRoomId, error, isLoading, lobbies, refresh };
}
