import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, House, RefreshCw, Trophy, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import gameTableBg from '@/games/classic/assets/backgrounds/game-table-bg.png';
import { resolveAvatarSrc } from '@/features/auth/model/avatarRegistry.js';
import { Button } from '@/shared/ui/button.jsx';
import { getLeaderboard } from '@/games/classic/api/stats.js';
import { getClassicCardLabel } from '@/games/classic/presentation/cardLabels.js';

function getPlayerName(player, fallback) {
  if (player?.type === 'Anonymous') {
    return player.data?.data?.nickname || player.data?.id || fallback;
  }

  if (player?.type === 'Google') {
    return player.data?.nickname || player.data?.name || player.data?.email || fallback;
  }

  return player?.data?.nickname || player?.name || fallback;
}

function getPlayerPicture(player) {
  if (player?.type === 'Anonymous') {
    return resolveAvatarSrc(player.data?.data?.picture);
  }

  if (player?.type === 'Google') {
    return resolveAvatarSrc(player.data?.picture_override || player.data?.picture);
  }

  return resolveAvatarSrc(player?.data?.picture || player?.picture);
}

function getCardLabel(card, t) {
  if (!card) {
    return t('leaderboard.noRounds');
  }

  return getClassicCardLabel(card);
}

function formatPercent(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(1)}%` : '0.0%';
}

function formatNumber(value, fractionDigits = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(fractionDigits) : '0';
}

function PlayerAvatar({ player }) {
  const picture = getPlayerPicture(player);

  return (
    <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-secondary text-secondary-foreground">
      {picture ? (
        <img src={picture} alt="" className="size-full object-cover" />
      ) : (
        <UserRound className="size-5" />
      )}
    </span>
  );
}

export function Leaderboard() {
  const { t } = useTranslation();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);

  const loadLeaderboard = useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await getLeaderboard({ limit: 100 });
      setLeaderboard(Array.isArray(response) ? response : []);
    } catch (requestError) {
      setError(requestError.message || t('leaderboard.loadError'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadLeaderboard();
  }, [loadLeaderboard]);

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 text-foreground md:px-6">
      <img
        src={gameTableBg}
        alt=""
        className="absolute inset-0 size-full object-cover opacity-65"
        draggable="false"
      />
      <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />
      <section className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-5">
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card/90 p-5 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              {t('leaderboard.eyebrow')}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              {t('leaderboard.title')}
            </h1>
          </div>

          <div className="flex gap-2">
            <Button
              asChild
              variant="outline"
              className="h-10 flex-1 cursor-pointer gap-2 sm:flex-none"
            >
              <Link to="/classic">
                <House className="size-4" />
                Home
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-10 flex-1 cursor-pointer gap-2 sm:flex-none"
              disabled={isLoading}
              onClick={() => void loadLeaderboard()}
            >
              <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
              {t('common.refresh')}
            </Button>
          </div>
        </div>

        {error ? (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-24 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : leaderboard.length ? (
          <>
            <div className="grid gap-3 md:hidden">
              {leaderboard.map((stats, index) => (
                <article
                  key={stats.player_id}
                  className="rounded-lg border border-border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary text-sm font-black text-primary-foreground">
                      {index + 1}
                    </span>
                    <PlayerAvatar player={stats.player} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">
                        {getPlayerName(stats.player, stats.player_id)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {stats.matches_won} {t('leaderboard.winsShort')} -{' '}
                        {formatPercent(stats.win_rate)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <span className="rounded-md bg-muted px-3 py-2">
                      {t('leaderboard.games')} <strong>{stats.games_played}</strong>
                    </span>
                    <span className="rounded-md bg-muted px-3 py-2">
                      {t('leaderboard.rounds')} <strong>{stats.rounds_won}</strong>
                    </span>
                    <span className="rounded-md bg-muted px-3 py-2">
                      {t('leaderboard.bid')} <strong>{formatPercent(stats.bid_accuracy)}</strong>
                    </span>
                    <span className="rounded-md bg-muted px-3 py-2">
                      {t('leaderboard.averageBid')}{' '}
                      <strong>{formatNumber(stats.average_bid, 2)}</strong>
                    </span>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-lg border border-border bg-card shadow-sm md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[62rem] text-sm">
                  <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left">#</th>
                      <th className="px-4 py-3 text-left">{t('leaderboard.player')}</th>
                      <th className="px-4 py-3 text-right">{t('leaderboard.games')}</th>
                      <th className="px-4 py-3 text-right">{t('leaderboard.wins')}</th>
                      <th className="px-4 py-3 text-right">{t('leaderboard.winRate')}</th>
                      <th className="px-4 py-3 text-right">{t('leaderboard.rounds')}</th>
                      <th className="px-4 py-3 text-right">{t('leaderboard.bidHit')}</th>
                      <th className="px-4 py-3 text-right">{t('leaderboard.averageBid')}</th>
                      <th className="px-4 py-3 text-right">{t('leaderboard.trumps')}</th>
                      <th className="px-4 py-3 text-left">{t('leaderboard.favorite')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {leaderboard.map((stats, index) => (
                      <tr key={stats.player_id} className="hover:bg-muted/50">
                        <td className="px-4 py-3 font-black">{index + 1}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <PlayerAvatar player={stats.player} />
                            <span className="font-bold">
                              {getPlayerName(stats.player, stats.player_id)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">{stats.games_played}</td>
                        <td className="px-4 py-3 text-right">{stats.matches_won}</td>
                        <td className="px-4 py-3 text-right">{formatPercent(stats.win_rate)}</td>
                        <td className="px-4 py-3 text-right">{stats.rounds_won}</td>
                        <td className="px-4 py-3 text-right">
                          {formatPercent(stats.bid_accuracy)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatNumber(stats.average_bid, 2)}
                        </td>
                        <td className="px-4 py-3 text-right">{stats.trump_cards}</td>
                        <td className="px-4 py-3">{getCardLabel(stats.favorite_card, t)}</td>
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
              <p className="mt-3 text-sm font-semibold">{t('leaderboard.emptyTitle')}</p>
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
