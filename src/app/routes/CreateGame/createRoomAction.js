import { normalizeLives } from '@/domain/lives.js';
import { lobbyLivesStorageKey } from '@/infrastructure/storage/storageKeys.js';
import { gamePath } from '../routeContract.js';

export function createRoomAction({ createLobby, navigate, storage }) {
  let pending = null;

  return {
    execute({ lives }) {
      if (!pending) {
        pending = (async () => {
          const selectedLives = normalizeLives(lives);
          const lobby = await createLobby({ lifes: selectedLives });
          const lobbyId = lobby?.lobby_id;
          if (!lobbyId) throw new Error('Lobby response is missing its id.');

          storage.setItem(lobbyLivesStorageKey(lobbyId), selectedLives);
          navigate(gamePath(lobbyId), { state: { lifes: selectedLives } });
          return lobby;
        })().finally(() => {
          pending = null;
        });
      }
      return pending;
    },
  };
}
