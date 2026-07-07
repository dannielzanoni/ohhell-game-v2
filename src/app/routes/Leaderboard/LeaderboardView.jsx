import { AlertCircle, RefreshCw, Trophy, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button.jsx';
import { createLeaderboardRows } from './leaderboardModel.js';

function PlayerAvatar({ alt, src }) {
  return (
    <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-secondary text-secondary-foreground">
      {src ? (
        <img src={src} alt={alt} className="size-full object-cover" />
      ) : (
        <UserRound aria-hidden="true" className="size-5" />
      )}
    </span>
  );
}

export function LeaderboardView({ controller }) {
  const { t } = useTranslation();
  const { error, isLoading, leaderboard, refresh } = controller;
  const rows = createLeaderboardRows(leaderboard, t);

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-6">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              {t('leaderboard.eyebrow')}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              {t('leaderboard.title')}
            </h1>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-10 w-full cursor-pointer gap-2 sm:w-auto"
            disabled={isLoading}
            onClick={() => void refresh()}
          >
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>
        </div>

        {error ? (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {error.message || t('leaderboard.loadError')}
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : rows.length ? (
          <>
            <div className="grid gap-3 md:hidden">
              {rows.map((row) => (
                <article
                  key={row.id}
                  className="rounded-lg border border-border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-sm font-black text-primary-foreground">
                      {row.position}
                    </span>
                    <PlayerAvatar alt={row.avatarAlt} src={row.avatarSrc} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">
                        {row.playerName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {row.matchesWon} {t('leaderboard.winsShort')} -{' '}
                        {row.winRate}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <span className="rounded-md bg-muted px-3 py-2">
                      {t('leaderboard.games')}{' '}
                      <strong>{row.gamesPlayed}</strong>
                    </span>
                    <span className="rounded-md bg-muted px-3 py-2">
                      {t('leaderboard.rounds')}{' '}
                      <strong>{row.roundsWon}</strong>
                    </span>
                    <span className="rounded-md bg-muted px-3 py-2">
                      {t('leaderboard.bid')}{' '}
                      <strong>{row.bidAccuracy}</strong>
                    </span>
                    <span className="rounded-md bg-muted px-3 py-2">
                      {t('leaderboard.averageBid')}{' '}
                      <strong>{row.averageBid}</strong>
                    </span>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-lg border border-border bg-card shadow-sm md:block">
              <div
                aria-label={t('leaderboard.tableScroll')}
                className="overflow-x-auto focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                role="region"
                tabIndex={0}
              >
                <table className="w-full min-w-[62rem] text-sm">
                  <caption className="sr-only">
                    {t('leaderboard.tableCaption')}
                  </caption>
                  <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left" scope="col">#</th>
                      <th className="px-4 py-3 text-left" scope="col">
                        {t('leaderboard.player')}
                      </th>
                      <th className="px-4 py-3 text-right" scope="col">
                        {t('leaderboard.games')}
                      </th>
                      <th className="px-4 py-3 text-right" scope="col">
                        {t('leaderboard.wins')}
                      </th>
                      <th className="px-4 py-3 text-right" scope="col">
                        {t('leaderboard.winRate')}
                      </th>
                      <th className="px-4 py-3 text-right" scope="col">
                        {t('leaderboard.rounds')}
                      </th>
                      <th className="px-4 py-3 text-right" scope="col">
                        {t('leaderboard.bidHit')}
                      </th>
                      <th className="px-4 py-3 text-right" scope="col">
                        {t('leaderboard.averageBid')}
                      </th>
                      <th className="px-4 py-3 text-right" scope="col">
                        {t('leaderboard.trumps')}
                      </th>
                      <th className="px-4 py-3 text-left" scope="col">
                        {t('leaderboard.favorite')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {rows.map((row) => (
                      <tr key={row.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-black">{row.position}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <PlayerAvatar alt={row.avatarAlt} src={row.avatarSrc} />
                            <span className="font-bold">
                              {row.playerName}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">{row.gamesPlayed}</td>
                        <td className="px-4 py-3 text-right">{row.matchesWon}</td>
                        <td className="px-4 py-3 text-right">
                          {row.winRate}
                        </td>
                        <td className="px-4 py-3 text-right">{row.roundsWon}</td>
                        <td className="px-4 py-3 text-right">
                          {row.bidAccuracy}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {row.averageBid}
                        </td>
                        <td className="px-4 py-3 text-right">{row.trumpCards}</td>
                        <td className="px-4 py-3">
                          {row.favoriteCard}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="grid min-h-72 place-items-center rounded-lg border border-border bg-card px-4 py-10 text-center shadow-sm">
            <div>
              <Trophy className="mx-auto size-10 text-muted-foreground" />
              <p className="mt-3 text-sm font-semibold">
                {t('leaderboard.emptyTitle')}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t('leaderboard.emptyDescription')}
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
