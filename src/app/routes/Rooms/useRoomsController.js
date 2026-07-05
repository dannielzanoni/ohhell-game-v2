import { useCallback, useEffect, useRef, useState } from 'react';
import { getLobbies } from '@/services/lobbyService.js';
import { normalizeRooms } from './roomModel.js';
import { copyText } from '@/infrastructure/browser/clipboard.js';

export function useRoomsController() {
  const [error, setError] = useState(null);
  const [lobbies, setLobbies] = useState([]);
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
      const response = await getLobbies({ signal: abortController.signal });
      if (abortController.signal.aborted) return;
      const nextLobbies = normalizeRooms(response);
      hasLoadedRef.current = true;
      setLobbies(nextLobbies);
      setStatus(nextLobbies.length ? 'ready' : 'empty');
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

  const copyRoomId = useCallback((roomId) => copyText(roomId), []);

  return {
    copyRoomId,
    error,
    isInitialLoading: status === 'initial-loading',
    isLoading: status === 'initial-loading' || status === 'refreshing',
    isRefreshing: status === 'refreshing',
    lobbies,
    refresh,
    status,
  };
}
