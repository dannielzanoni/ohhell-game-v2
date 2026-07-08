import { useEffect, useState } from 'react';
import { AlertCircle, DoorOpen, House, Plus, RefreshCw, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import hellHandBg from '@/assets/backgrounds/hell-hand-bg.avif';
import { Button } from '@/components/ui/button.jsx';
import { gameTypes, getGameTypeOption } from '@/services/gameTypesService.js';
import { startHellHandHomeTheme } from '@/services/hellHandAudioService.js';
import { getLobbies } from '@/services/lobbyService.js';

function getLobbyId(lobby) {
  return lobby?.id || lobby?.lobby_id || '';
}

function isHellHandLobby(lobby) {
  return lobby?.game_type === gameTypes.FODINHA_POWER;
}

export function HellHandRooms() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [lobbies, setLobbies] = useState([]);

  const loadRooms = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await getLobbies();
      const rooms = Array.isArray(response) ? response : [];
      setLobbies(rooms.filter(isHellHandLobby));
    } catch (requestError) {
      setError(requestError.message || t('pages.rooms.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    startHellHandHomeTheme();
    void loadRooms();
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black px-4 py-5 text-stone-100 md:px-6 lg:h-dvh lg:min-h-0 lg:overflow-hidden lg:py-4">
      <img
        src={hellHandBg}
        alt=""
        className="absolute inset-0 size-full scale-105 object-cover"
        draggable="false"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(185,28,28,0.28),transparent_34%),linear-gradient(115deg,rgba(0,0,0,0.94),rgba(36,10,10,0.78)_48%,rgba(0,0,0,0.96))]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/70 to-transparent" />

      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-4 lg:h-full lg:min-h-0">
        <header className="rounded-lg border border-red-200/12 bg-black/70 p-4 shadow-2xl shadow-black/35 backdrop-blur lg:shrink-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase text-amber-300/80">
                {t('pages.rooms.eyebrow')}
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-3xl">
                Hell Hand {t('pages.rooms.title')}
              </h1>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:flex">
              <Button
                asChild
                variant="outline"
                className="h-10 cursor-pointer gap-2 border-red-200/20 bg-black/55 text-stone-100 hover:border-amber-300/45 hover:bg-red-950/55 hover:text-amber-100"
              >
                <Link to="/hell-hand">
                  <House className="size-4" />
                  Home
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-10 cursor-pointer gap-2 border-red-200/20 bg-black/55 text-stone-100 hover:border-amber-300/45 hover:bg-red-950/55 hover:text-amber-100"
                disabled={isLoading}
                onClick={() => void loadRooms()}
              >
                <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
                {t('common.refresh')}
              </Button>
              <Button
                asChild
                className="h-10 cursor-pointer gap-2 border border-amber-200/40 bg-amber-300 text-black shadow-lg shadow-black/30 hover:bg-amber-200"
              >
                <Link to="/hell-hand/game">
                  <Plus className="size-4" />
                  {t('pages.rooms.create')}
                </Link>
              </Button>
            </div>
          </div>
        </header>

        {error ? (
          <div className="flex items-center gap-2 rounded-lg border border-red-400/50 bg-red-950/45 px-4 py-3 text-sm font-semibold text-red-100 shadow-lg shadow-black/30 backdrop-blur">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        ) : null}

        <section className="flex min-h-[26rem] flex-col rounded-lg border border-red-200/12 bg-black/68 shadow-2xl shadow-black/35 backdrop-blur lg:min-h-0 lg:flex-1">
          <div className="hidden grid-cols-[1fr_8rem_8rem] border-b border-red-200/12 px-5 py-3 text-xs font-black uppercase text-amber-300/70 md:grid">
            <span>{t('pages.rooms.room')}</span>
            <span className="text-center">{t('pages.rooms.players')}</span>
            <span className="text-right">{t('pages.rooms.enter')}</span>
          </div>

          {isLoading ? (
            <div className="grid gap-3 p-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-20 animate-pulse rounded-lg border border-red-200/8 bg-red-950/20"
                />
              ))}
            </div>
          ) : lobbies.length ? (
            <div className="min-h-0 divide-y divide-red-200/10 overflow-y-auto">
              {lobbies.map((lobby) => {
                const lobbyId = getLobbyId(lobby);
                const playerCount = Number(lobby.player_count) || 0;
                const gameTypeLabelKey = getGameTypeOption(lobby.game_type)?.labelKey;
                const gameTypeLabel = gameTypeLabelKey
                  ? t(gameTypeLabelKey)
                  : lobby.game_type;

                return (
                  <article
                    key={lobbyId}
                    className="grid gap-4 p-4 transition hover:bg-red-950/25 md:grid-cols-[1fr_8rem_8rem] md:items-center md:px-5"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-md border border-amber-200/15 bg-amber-950/35 text-amber-200">
                          <DoorOpen className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-stone-100">
                            {lobbyId}
                          </p>
                          <p className="text-xs font-semibold text-stone-400">
                            {gameTypeLabel || t('pages.rooms.regionWaiting')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-red-200/12 bg-black/55 px-3 py-2 text-sm font-bold text-stone-100 md:mx-auto">
                      <Users className="size-4 text-amber-200" />
                      {playerCount}/10
                    </div>

                    <Button
                      type="button"
                      className="h-10 cursor-pointer gap-2 border border-amber-200/40 bg-amber-300 text-black hover:bg-amber-200 md:justify-self-end"
                      onClick={() =>
                        navigate(`/game/${lobbyId}`, {
                          state: {
                            gameType: lobby.game_type || gameTypes.FODINHA_POWER,
                            returnToRooms: '/hell-hand/rooms',
                          },
                        })
                      }
                    >
                      <DoorOpen className="size-4" />
                      {t('common.join')}
                    </Button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="grid min-h-52 flex-1 place-items-center px-4 py-10 text-center">
              <div>
                <DoorOpen className="mx-auto size-10 text-amber-200/80" />
                <p className="mt-3 text-sm font-black text-stone-100">
                  {t('pages.rooms.emptyTitle')}
                </p>
                <p className="mt-1 text-sm font-semibold text-stone-400">
                  {t('pages.rooms.emptyDescription')}
                </p>
              </div>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
