import { resolveAvatarSrc } from '@/assets/catalog/avatarCatalog.js';
import { getCardLabel as getCatalogCardLabel } from '@/assets/catalog/cardCatalog.js';

export function getLeaderboardPlayerName(player, fallback) {
  if (player?.type === 'Anonymous') {
    return player.data?.data?.nickname || player.data?.id || fallback;
  }

  if (player?.type === 'Google') {
    return (
      player.data?.nickname ||
      player.data?.name ||
      player.data?.email ||
      fallback
    );
  }

  return player?.data?.nickname || player?.name || fallback;
}

export function getLeaderboardAvatarSrc(player) {
  if (player?.type === 'Anonymous') {
    return resolveAvatarSrc(player.data?.data?.picture);
  }

  if (player?.type === 'Google') {
    return resolveAvatarSrc(player.data?.picture_override || player.data?.picture);
  }

  return resolveAvatarSrc(player?.data?.picture || player?.picture);
}

export function formatLeaderboardPercent(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(1)}%` : '0.0%';
}

export function formatLeaderboardNumber(value, fractionDigits = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(fractionDigits) : '0';
}

export function getLeaderboardCardLabel(card, t) {
  if (!card) {
    return t('leaderboard.noRounds');
  }

  return getCatalogCardLabel(card, t);
}

export function createLeaderboardRows(entries, t) {
  return (Array.isArray(entries) ? entries : []).map((stats, index) => {
    const playerId = stats.player_id || `player-${index + 1}`;
    const playerName = getLeaderboardPlayerName(stats.player, playerId);

    return {
      averageBid: formatLeaderboardNumber(stats.average_bid, 2),
      avatarAlt: t('leaderboard.playerAvatar', { name: playerName }),
      avatarSrc: getLeaderboardAvatarSrc(stats.player),
      bidAccuracy: formatLeaderboardPercent(stats.bid_accuracy),
      favoriteCard: getLeaderboardCardLabel(stats.favorite_card, t),
      gamesPlayed: formatLeaderboardNumber(stats.games_played),
      id: playerId,
      matchesWon: formatLeaderboardNumber(stats.matches_won),
      playerName,
      position: index + 1,
      roundsWon: formatLeaderboardNumber(stats.rounds_won),
      trumpCards: formatLeaderboardNumber(stats.trump_cards),
      winRate: formatLeaderboardPercent(stats.win_rate),
    };
  });
}
