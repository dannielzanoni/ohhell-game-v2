import { useState } from 'react';
import { Home, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import gameTableBg from '@/games/classic/assets/backgrounds/game-table-bg.png';
import { CLASSIC_PATHS } from '@/games/classic/paths.js';
import { GAME_TYPES } from '@/games/core/model/gameTypes.js';
import { createLobby } from '@/games/core/api/lobby.js';
import { isMissingAuthTokenError } from '@/features/auth/api/authService.js';
import { InteractiveHoverButton } from '@/shared/ui/interactive-hover-button.jsx';
import { Input } from '@/shared/ui/input.jsx';

const LIFE_SETTINGS = Object.freeze({
  defaultValue: 5,
  max: 10,
  min: 1,
  roundDamage: 1,
});

function getLivesValidationError(value) {
  const selectedLives = Number(value);

  if (
    !Number.isInteger(selectedLives) ||
    selectedLives < LIFE_SETTINGS.min ||
    selectedLives > LIFE_SETTINGS.max
  ) {
    return {
      key: 'pages.createGame.livesRangeError',
      values: { max: LIFE_SETTINGS.max, min: LIFE_SETTINGS.min },
    };
  }

  return null;
}

export function CreateGame() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [lives, setLives] = useState(String(LIFE_SETTINGS.defaultValue));
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const handleCreateGame = async () => {
    setCreateError('');

    const validationError = getLivesValidationError(lives);
    if (validationError) {
      setCreateError(t(validationError.key, validationError.values));
      return;
    }

    const selectedLives = Number(lives);
    setIsCreating(true);

    try {
      const lobby = await createLobby({
        gameType: GAME_TYPES.CLASSIC,
        lifes: selectedLives,
      });
      const lobbyGameType = lobby.game_type || GAME_TYPES.CLASSIC;

      localStorage.setItem(`ohhell_lobby_lifes_${lobby.lobby_id}`, String(selectedLives));
      localStorage.setItem(`ohhell_lobby_game_type_${lobby.lobby_id}`, lobbyGameType);

      navigate(CLASSIC_PATHS.game(lobby.lobby_id), {
        state: {
          gameType: lobbyGameType,
          lifes: selectedLives,
          returnToRooms: CLASSIC_PATHS.ROOMS,
        },
      });
    } catch (error) {
      if (!isMissingAuthTokenError(error)) {
        setCreateError(error.message || t('pages.createGame.createError'));
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="relative isolate min-h-screen overflow-hidden">
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
        <img
          src={gameTableBg}
          alt=""
          className="size-full object-cover opacity-65"
          draggable="false"
        />
      </div>
      <div className="absolute inset-0 z-0 bg-background/80 backdrop-blur-[2px]" />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-8">
        <div className="rounded-lg border border-border bg-card/85 p-8 shadow-2xl shadow-black/20 backdrop-blur md:p-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {t('pages.createGame.liveTable')}
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
            {t('pages.links.createGame.label')}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            {t('pages.createGame.configureBefore')}
          </p>
        </div>

        <section className="mx-auto w-full max-w-md min-w-0 rounded-lg border border-border bg-card/85 p-5 shadow-lg shadow-black/10 backdrop-blur md:p-6">
          <h2 className="text-2xl font-bold">{t('pages.createGame.configurations')}</h2>

          <div className="mt-6 grid gap-5">
            <label className="block min-w-0">
              <span className="text-sm font-semibold text-foreground">
                {t('pages.createGame.livesNumber')}
              </span>
              <Input
                className="mt-3 h-11 rounded-full border-input bg-background px-4 text-sm text-foreground"
                inputMode="numeric"
                max={LIFE_SETTINGS.max}
                min={LIFE_SETTINGS.min}
                step={1}
                type="number"
                value={lives}
                onChange={(event) => setLives(event.target.value)}
              />
              <span className="mt-2 block text-sm leading-6 text-muted-foreground">
                {t('pages.createGame.livesRangeHint', {
                  max: LIFE_SETTINGS.max,
                  min: LIFE_SETTINGS.min,
                  roundDamage: LIFE_SETTINGS.roundDamage,
                })}
              </span>
            </label>

            <div className="flex w-full min-w-0 flex-col items-start gap-3 rounded-lg border border-border bg-background/55 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-foreground">
                {t('pages.createGame.publicRoom')}
              </p>
              <button
                type="button"
                disabled
                aria-label={t('pages.createGame.enablePublicRoom')}
                className="relative h-7 w-12 shrink-0 cursor-not-allowed rounded-full bg-muted opacity-60"
              >
                <span className="absolute left-1 top-1 size-5 rounded-full bg-muted-foreground/70" />
              </button>
            </div>

            <div className="grid w-full min-w-0 gap-3 sm:grid-cols-2">
              <InteractiveHoverButton
                type="button"
                disabled={isCreating}
                className="h-12 w-full min-w-0 border-border text-base disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleCreateGame}
              >
                <span className="inline-flex items-center gap-2">
                  {isCreating ? (
                    <i className="pi pi-spin pi-spinner text-sm" />
                  ) : (
                    <Play className="size-4" />
                  )}
                  {isCreating ? t('pages.createGame.creating') : t('common.play')}
                </span>
              </InteractiveHoverButton>

              <Link
                to={CLASSIC_PATHS.ROOT}
                className="inline-flex h-12 w-full min-w-0 items-center justify-center gap-2 rounded-full border border-border bg-background px-6 text-base font-semibold text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              >
                <Home className="size-4" />
                {t('common.home')}
              </Link>
            </div>

            {createError ? <p className="text-sm text-destructive">{createError}</p> : null}
          </div>
        </section>
      </section>
    </main>
  );
}
