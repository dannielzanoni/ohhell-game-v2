import { useEffect, useState } from 'react';
import { AlertCircle, DoorOpen, Plus, RefreshCw, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button.jsx';
import { getLobbies } from '@/services/lobbyService.js';

function getLobbyId(lobby) {
  return lobby?.id || lobby?.lobby_id || '';
}

export function Rooms() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lobbies, setLobbies] = useState([]);

  const loadRooms = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await getLobbies();
      setLobbies(Array.isArray(response) ? response : []);
    } catch (requestError) {
      setError(requestError.message || 'Nao foi possivel carregar as salas.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadRooms();
  }, []);

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-6">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Live tables
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Rooms
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button
              type="button"
              variant="outline"
              className="h-10 cursor-pointer gap-2"
              disabled={isLoading}
              onClick={() => void loadRooms()}
            >
              <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button asChild className="h-10 cursor-pointer gap-2">
              <Link to="/create-game">
                <Plus className="size-4" />
                Criar
              </Link>
            </Button>
          </div>
        </div>

        {error ? (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        ) : null}

        <div className="rounded-lg border border-border bg-card shadow-sm">
          <div className="hidden grid-cols-[1fr_8rem_8rem] border-b border-border px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground md:grid">
            <span>Sala</span>
            <span className="text-center">Players</span>
            <span className="text-right">Entrar</span>
          </div>

          {isLoading ? (
            <div className="grid gap-3 p-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-lg bg-muted"
                />
              ))}
            </div>
          ) : lobbies.length ? (
            <div className="divide-y divide-border">
              {lobbies.map((lobby) => {
                const lobbyId = getLobbyId(lobby);
                const playerCount = Number(lobby.player_count) || 0;

                return (
                  <article
                    key={lobbyId}
                    className="grid gap-4 p-4 md:grid-cols-[1fr_8rem_8rem] md:items-center md:px-5"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-secondary-foreground">
                          <DoorOpen className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-foreground">
                            {lobbyId}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            BR · Waiting
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-semibold md:mx-auto">
                      <Users className="size-4 text-muted-foreground" />
                      {playerCount}/10
                    </div>

                    <Button
                      type="button"
                      className="h-10 cursor-pointer gap-2 md:justify-self-end"
                      onClick={() => navigate(`/game/${lobbyId}`)}
                    >
                      <DoorOpen className="size-4" />
                      Join
                    </Button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="grid min-h-52 place-items-center px-4 py-10 text-center">
              <div>
                <DoorOpen className="mx-auto size-10 text-muted-foreground" />
                <p className="mt-3 text-sm font-semibold">Nenhuma sala aberta</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Crie uma nova mesa para convidar seus amigos.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
