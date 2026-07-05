import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createLobby } from '@/services/lobbyService.js';
import { storage } from '@/infrastructure/storage/storageAdapter.js';
import { lobbyLivesStorageKey } from '@/infrastructure/storage/storageKeys.js';
import { DEFAULT_LIVES, isValidLives, normalizeLives } from '@/domain/lives.js';

export function useCreateGameController() {
  const navigate = useNavigate();
  const [lives, setLivesState] = useState(String(DEFAULT_LIVES));
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);

  const createGame = useCallback(async () => {
    if (isCreating) return;

    setIsCreating(true);
    setError(null);

    try {
      const selectedLives = normalizeLives(lives);
      const lobby = await createLobby({ lifes: selectedLives });

      storage.setItem(lobbyLivesStorageKey(lobby.lobby_id), selectedLives);
      navigate(`/game/${lobby.lobby_id}`, {
        state: { lifes: selectedLives },
      });
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsCreating(false);
    }
  }, [isCreating, lives, navigate]);

  const setLives = useCallback((value) => {
    if (isValidLives(value)) setLivesState(String(value));
  }, []);

  return { createGame, error, isCreating, lives, setLives };
}
