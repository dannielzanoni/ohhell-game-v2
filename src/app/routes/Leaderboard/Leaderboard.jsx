import { useEffect, useState } from 'react';
import { AlertCircle, RefreshCw, Trophy, UserRound } from 'lucide-react';
import { avatars } from '@/components/auth/AvatarEditModal.jsx';
import { Button } from '@/components/ui/button.jsx';
import { getLeaderboard } from '@/services/statsService.js';

const rankLabels = {
  Eight: '8',
  Eleven: '11',
  Five: '5',
  Four: '4',
  Nine: '9',
  One: 'A',
  Seven: '7',
  Six: '6',
  Ten: '10',
  Three: '3',
  Twelve: '12',
  Two: '2',
};

const suitLabels = {
  Clubs: 'paus',
  Cups: 'copas',
  Golds: 'ouro',
  Swords: 'espada',
};

function resolveAvatarSrc(picture) {
  if (!picture) {
    return '';
  }

  const avatar = avatars.find((item) => {
    return item.picture === picture || item.id === picture || item.src === picture;
  });

  return avatar?.src || picture;
}

function getPlayerName(player, fallback) {
  if (player?.type === 'Anonymous') {
    return player.data?.data?.nickname || player.data?.id || fallback;
  }

  if (player?.type === 'Google') {
    return player.data?.name || player.data?.email || fallback;
  }

  return player?.data?.nickname || player?.name || fallback;
}

function getPlayerPicture(player) {
  if (player?.type === 'Anonymous') {
    return resolveAvatarSrc(player.data?.data?.picture);
  }

  if (player?.type === 'Google') {
    return resolveAvatarSrc(player.data?.picture);
  }

  return resolveAvatarSrc(player?.data?.picture || player?.picture);
}

function getCardLabel(card) {
  if (!card) {
    return 'Sem rounds';
  }

  const rank = rankLabels[card.rank] || card.rank;
  const suit = suitLabels[card.suit] || card.suit;

  return `${rank} de ${suit}`;
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
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);

  const loadLeaderboard = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await getLeaderboard({ limit: 100 });
      setLeaderboard(Array.isArray(response) ? response : []);
    } catch (requestError) {
      setError(requestError.message || 'Nao foi possivel carregar o ranking.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadLeaderboard();
  }, []);

  return (
    <main className="min-h-screen bg-background px-4 py-6 text-foreground md:px-6">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Global statistics
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              Leaderboard
            </h1>
          </div>

          <Button
            type="button"
            variant="outline"
            className="h-10 w-full cursor-pointer gap-2 sm:w-auto"
            disabled={isLoading}
            onClick={() => void loadLeaderboard()}
          >
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
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
                        {stats.matches_won} wins · {formatPercent(stats.win_rate)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <span className="rounded-md bg-muted px-3 py-2">
                      Games <strong>{stats.games_played}</strong>
                    </span>
                    <span className="rounded-md bg-muted px-3 py-2">
                      Rounds <strong>{stats.rounds_won}</strong>
                    </span>
                    <span className="rounded-md bg-muted px-3 py-2">
                      Bid <strong>{formatPercent(stats.bid_accuracy)}</strong>
                    </span>
                    <span className="rounded-md bg-muted px-3 py-2">
                      Avg <strong>{formatNumber(stats.average_bid, 2)}</strong>
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
                      <th className="px-4 py-3 text-left">Player</th>
                      <th className="px-4 py-3 text-right">Games</th>
                      <th className="px-4 py-3 text-right">Wins</th>
                      <th className="px-4 py-3 text-right">Win rate</th>
                      <th className="px-4 py-3 text-right">Rounds</th>
                      <th className="px-4 py-3 text-right">Bid hit</th>
                      <th className="px-4 py-3 text-right">Avg bid</th>
                      <th className="px-4 py-3 text-right">Trumps</th>
                      <th className="px-4 py-3 text-left">Favorite</th>
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
                        <td className="px-4 py-3 text-right">
                          {formatPercent(stats.win_rate)}
                        </td>
                        <td className="px-4 py-3 text-right">{stats.rounds_won}</td>
                        <td className="px-4 py-3 text-right">
                          {formatPercent(stats.bid_accuracy)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {formatNumber(stats.average_bid, 2)}
                        </td>
                        <td className="px-4 py-3 text-right">{stats.trump_cards}</td>
                        <td className="px-4 py-3">{getCardLabel(stats.favorite_card)}</td>
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
              <p className="mt-3 text-sm font-semibold">Sem dados ainda</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Finalize partidas para aparecer no ranking.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
