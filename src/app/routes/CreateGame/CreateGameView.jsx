import { Home, Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import gameBg from '@/assets/videos/game-bg.mp4';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button.jsx';
import { LivesSelector } from './LivesSelector.jsx';

export function CreateGameView({ controller }) {
  const { t } = useTranslation();
  const { createGame, error, isCreating, lives, setLives } = controller;
  const createError = error?.message || (error ? t('pages.createGame.createError') : '');

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-20 overflow-hidden bg-black">
        <video
          className="h-full w-full object-cover opacity-45"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src={gameBg} type="video/mp4" />
        </video>
      </div>
      <div className="absolute inset-0 -z-10 bg-background/80 backdrop-blur-[2px]" />

      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-6 px-6 py-8">
        <div className="rounded-lg border border-border bg-card/85 p-8 shadow-2xl shadow-black/20 backdrop-blur md:p-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {t('pages.createGame.liveTable')}
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
            Oh Hell Game
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            {t('pages.createGame.configureBefore')}
          </p>
        </div>

        <section className="mx-auto w-full max-w-md min-w-0 rounded-lg border border-border bg-card/85 p-5 shadow-lg shadow-black/10 backdrop-blur md:p-6">
          <div>
            <h2 className="text-2xl font-bold">
              {t('pages.createGame.configurations')}
            </h2>
          </div>

          <div className="mt-6 grid gap-5">
            <LivesSelector lives={lives} onChange={setLives} />

            <div className="flex w-full min-w-0 flex-col items-start gap-3 rounded-lg border border-border bg-background/55 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {t('pages.createGame.publicRoom')}
                </p>
              </div>
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
            onClick={createGame}
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
                to="/"
                className="inline-flex h-12 w-full min-w-0 items-center justify-center gap-2 rounded-full border border-border bg-background px-6 text-base font-semibold text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              >
                <Home className="size-4" />
                {t('common.home')}
              </Link>
            </div>

            {createError ? (
              <p className="text-sm text-destructive">{createError}</p>
            ) : null}
          </div>
        </section>
      </section>
    </main>
  );
}
