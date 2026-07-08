import { AlertCircle, Copy, DoorOpen, Plus, RefreshCw, Users } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button.jsx';
import { routePaths } from '../routeContract.js';
import { roomDestination } from './roomNavigation.js';

export function RoomsView({ controller }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const {
    copyRoomId,
    error,
    isInitialLoading = controller.isLoading,
    isLoading,
    isRefreshing = false,
    lobbies,
    refresh,
    status,
  } = controller;

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-6">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-5">
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              {t('pages.rooms.eyebrow')}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              {t('pages.rooms.title')}
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <Button
              type="button"
              variant="outline"
              className="h-10 cursor-pointer gap-2"
              disabled={isLoading}
              onClick={() => void refresh()}
            >
              <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
              {t('common.refresh')}
              {isRefreshing ? <span className="sr-only">{t('pages.rooms.refreshing')}</span> : null}
            </Button>
            <Button asChild className="h-10 cursor-pointer gap-2">
              <Link to={routePaths.createGame}>
                <Plus className="size-4" />
                {t('pages.rooms.create')}
              </Link>
            </Button>
          </div>
        </div>

        {error ? (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {error.message || t('pages.rooms.loadError')}
          </div>
        ) : null}

        <div
          aria-busy={isLoading}
          data-testid="rooms-list"
          className="min-w-0 overflow-hidden rounded-lg border border-border bg-card shadow-sm"
        >
          <div className="hidden grid-cols-[minmax(0,1fr)_7rem_7rem_7rem] border-b border-border px-5 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground md:grid">
            <span>{t('pages.rooms.room')}</span>
            <span className="text-center">{t('pages.rooms.players')}</span>
            <span className="text-center">{t('pages.rooms.state')}</span>
            <span className="text-right">{t('pages.rooms.enter')}</span>
          </div>

          {isInitialLoading ? (
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
                return (
                  <article
                    key={lobby.id}
                    aria-label={`${t('pages.rooms.room')} ${lobby.id}`}
                    className="grid min-w-0 gap-4 p-4 md:grid-cols-[minmax(0,1fr)_7rem_7rem_7rem] md:items-center md:px-5"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-secondary-foreground">
                          <DoorOpen className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <p title={lobby.id} className="truncate text-sm font-bold text-foreground">
                            {lobby.id}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t('pages.rooms.regionWaiting')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-semibold md:mx-auto">
                      <Users className="size-4 text-muted-foreground" />
                      {lobby.players}/{lobby.capacity}
                    </div>

                    <span className="truncate text-sm font-semibold text-muted-foreground md:text-center">
                      {lobby.state}
                    </span>

                    <div className="grid grid-cols-[2.75rem_1fr] gap-2 md:block md:justify-self-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="size-11 md:hidden"
                        aria-label={t('pages.rooms.copyRoomId', { id: lobby.id })}
                        onClick={() => void copyRoomId(lobby.id)}
                      >
                        <Copy aria-hidden="true" className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        className="h-11 w-full cursor-pointer gap-2 md:h-10 md:w-auto"
                        onClick={() => navigate(roomDestination(lobby.id))}
                      >
                        <DoorOpen className="size-4" />
                        {t('common.join')}
                      </Button>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : status === 'error' ? (
            <div className="grid min-h-52 place-items-center px-4 py-10 text-center text-sm text-destructive">
              {error?.message || t('pages.rooms.loadError')}
            </div>
          ) : (
            <div className="grid min-h-52 place-items-center px-4 py-10 text-center">
              <div>
                <DoorOpen className="mx-auto size-10 text-muted-foreground" />
                <p className="mt-3 text-sm font-semibold">
                  {t('pages.rooms.emptyTitle')}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('pages.rooms.emptyDescription')}
                </p>
                <Button asChild className="mt-5 h-11 gap-2">
                  <Link to={routePaths.createGame}>
                    <Plus aria-hidden="true" className="size-4" />
                    {t('pages.rooms.create')}
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
