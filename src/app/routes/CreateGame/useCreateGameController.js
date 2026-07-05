import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createLobby } from '@/services/lobbyService.js';
import { storage } from '@/infrastructure/storage/storageAdapter.js';
import { DEFAULT_LIVES, isValidLives } from '@/domain/lives.js';
import { createRoomAction } from './createRoomAction.js';

export function useCreateGameController() {
  const navigate = useNavigate();
  const [lives, setLivesState] = useState(String(DEFAULT_LIVES));
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);
  const actionRef = useRef(null);
  if (!actionRef.current) {
    actionRef.current = createRoomAction({ createLobby, navigate, storage });
  }

  const createGame = useCallback(async () => {
    if (isCreating) return;

    setIsCreating(true);
    setError(null);

    try {
      await actionRef.current.execute({ lives });
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsCreating(false);
    }
  }, [isCreating, lives]);

  const setLives = useCallback((value) => {
    if (isValidLives(value)) setLivesState(String(value));
  }, []);

  return { createGame, error, isCreating, lives, setLives };
}
