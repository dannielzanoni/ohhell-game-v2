import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createLobby } from '@/services/lobbyService.js';
import { storage } from '@/infrastructure/storage/storageAdapter.js';
import { lobbyLivesStorageKey } from '@/infrastructure/storage/storageKeys.js';

export function useCreateGameController() {
  const navigate = useNavigate();
  const [lives, setLives] = useState('5');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState(null);

  const createGame = useCallback(async () => {
    if (isCreating) return;

    setIsCreating(true);
    setError(null);

    try {
      const selectedLives = Number(lives);
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

  return { createGame, error, isCreating, lives, setLives };
}
