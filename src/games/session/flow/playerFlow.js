import { avatars, resolveAvatarSrc } from '@/features/auth/model/avatarRegistry.js';
import { getAuthToken } from '@/shared/api/apiClient.js';
import { LIFE_LOSS_HIGHLIGHT_THRESHOLD } from '@/games/session/config/tablePresentation.js';

function decodeTokenPayload(token) {
  if (!token) return null;

  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function getClaimsPlayerId(player) {
  if (!player) return null;
  if (player.type === 'Anonymous') return player.data?.id || null;
  if (player.type === 'Google') return player.data?.email || null;
  return player.id || player.email || null;
}

export function getClaimsNickname(player, fallbackId) {
  if (player?.type === 'Anonymous') {
    return player.data?.data?.nickname || player.data?.id || fallbackId;
  }
  if (player?.type === 'Google') {
    return player.data?.nickname || player.data?.name || player.data?.email || fallbackId;
  }
  return player?.data?.nickname || player?.name || player?.id || fallbackId;
}

export function getClaimsPicture(player) {
  if (player?.type === 'Anonymous') return player.data?.data?.picture || '';
  if (player?.type === 'Google') {
    return player.data?.picture_override || player.data?.picture || '';
  }
  return player?.data?.picture || player?.picture || '';
}

export function getCurrentPlayerId() {
  const payload = decodeTokenPayload(getAuthToken());
  const user = payload?.user || payload;
  return getClaimsPlayerId(user) || payload?.id || payload?.email || null;
}

export function getSavedPlayer() {
  const nickname = localStorage.getItem('ohhell_guest_nickname') || 'Guest';
  const avatarId = localStorage.getItem('ohhell_guest_avatar_id') || '';
  const avatar = avatars.find((item) => item.id === avatarId);
  return { avatarSrc: avatar?.src || '', nickname };
}

export function normalizePlayer({ bid = null, fallbackId, lifes, mercenaryId, player, ready }) {
  const id = getClaimsPlayerId(player) || fallbackId;
  const isCurrentPlayer = id && id === getCurrentPlayerId();
  const savedPlayer = isCurrentPlayer ? getSavedPlayer() : { avatarSrc: '', nickname: '' };

  return {
    avatarSrc: resolveAvatarSrc(getClaimsPicture(player)) || savedPlayer.avatarSrc,
    bid,
    id,
    lifes,
    mana: null,
    mercenaryId: mercenaryId || null,
    nickname: getClaimsNickname(player, id) || savedPlayer.nickname,
    points: 0,
    ready: Boolean(ready),
    turnToPlay: false,
  };
}

export function createFallbackPlayer(id, lifes) {
  const isCurrentPlayer = id && id === getCurrentPlayerId();
  const savedPlayer = isCurrentPlayer ? getSavedPlayer() : { avatarSrc: '', nickname: '' };
  return {
    avatarSrc: savedPlayer.avatarSrc,
    bid: null,
    id,
    lifes,
    mana: null,
    mercenaryId: null,
    nickname: savedPlayer.nickname || id || 'Guest',
    points: 0,
    ready: false,
    turnToPlay: false,
  };
}

export function mergeLifesIntoPlayers(playersById, lifesByPlayer, defaultLifes, overrides = {}) {
  return Object.entries(lifesByPlayer || {}).reduce(
    (nextPlayers, [playerId, life]) => {
      const existing = nextPlayers[playerId] || createFallbackPlayer(playerId, defaultLifes);
      nextPlayers[playerId] = { ...existing, ...overrides, lifes: life };
      return nextPlayers;
    },
    { ...playersById },
  );
}

export function createGameEndSummary(lifesByPlayer, playersById, defaultLifes) {
  const lifeEntries = Object.entries(lifesByPlayer || {})
    .map(([playerId, life]) => [playerId, Number(life)])
    .filter(([, life]) => Number.isFinite(life));
  const maxLife = lifeEntries.length ? Math.max(...lifeEntries.map(([, life]) => life)) : 0;
  const winnerIds =
    maxLife > 0
      ? lifeEntries.filter(([, life]) => life === maxLife).map(([playerId]) => playerId)
      : [];
  const winners = winnerIds.map((playerId) => ({
    ...(playersById[playerId] || createFallbackPlayer(playerId, defaultLifes)),
    lifes: lifesByPlayer[playerId],
  }));

  return {
    noWinners: winners.length === 0,
    winnerNames: winners.map((player) => player.nickname || player.id).join(', '),
    winners,
  };
}

export function createLifeLossHighlight(lifesByPlayer, playersById, defaultLifes) {
  for (const [playerId, currentLifes] of Object.entries(lifesByPlayer || {})) {
    const player = playersById[playerId] || createFallbackPlayer(playerId, defaultLifes);
    const lost = Number(player.lifes ?? currentLifes) - Number(currentLifes);
    if (Number.isFinite(lost) && lost >= LIFE_LOSS_HIGHLIGHT_THRESHOLD) {
      return { lost, player: { ...player, lifes: currentLifes } };
    }
  }
  return null;
}

export function normalizeStatusMap(statusMap, lifes, previousPlayers = {}) {
  return Object.entries(statusMap || {}).reduce((players, [id, status]) => {
    const previous = previousPlayers[id];
    const nextPlayer = normalizePlayer({
      bid: previous?.bid ?? null,
      fallbackId: id,
      lifes: previous?.lifes ?? lifes,
      mercenaryId: status.mercenary_id,
      player: status.player,
      ready: status.ready,
    });
    players[nextPlayer.id] = {
      ...nextPlayer,
      mercenaryId: status.mercenary_id || previous?.mercenaryId || null,
      points: previous?.points ?? nextPlayer.points,
      turnToPlay: previous?.turnToPlay ?? nextPlayer.turnToPlay,
    };
    return players;
  }, {});
}

export function getLocalPlayerIdCandidates({
  currentPlayerId,
  gameInfo,
  localPlayerIds = [],
  playersById = {},
  statusMap,
}) {
  const tokenPlayerId = getCurrentPlayerId();
  const savedPlayer = getSavedPlayer();
  const candidates = [tokenPlayerId, currentPlayerId, ...localPlayerIds].filter(Boolean);

  Object.values(playersById).forEach((player) => {
    if (player?.id && player.id === tokenPlayerId) candidates.push(player.id);
  });
  Object.entries(statusMap || {}).forEach(([id, status]) => {
    const nickname = getClaimsNickname(status.player, id);
    const avatarSrc = resolveAvatarSrc(getClaimsPicture(status.player));
    if (tokenPlayerId && id === tokenPlayerId) {
      candidates.push(id);
    } else if (
      savedPlayer.nickname &&
      nickname === savedPlayer.nickname &&
      (!savedPlayer.avatarSrc || !avatarSrc || savedPlayer.avatarSrc === avatarSrc)
    ) {
      candidates.push(id);
    }
  });

  const gamePlayerIds = new Set((gameInfo?.info || []).map((info) => info.id));
  return Array.from(new Set(candidates)).filter(
    (id) => !gamePlayerIds.size || gamePlayerIds.has(id),
  );
}

export function applyGameInfo(playersById, gameInfo, defaultLifes) {
  if (!gameInfo?.info) return playersById;
  const nextPlayers = { ...playersById };
  gameInfo.info.forEach((info) => {
    const existing = nextPlayers[info.id] || createFallbackPlayer(info.id, defaultLifes);
    nextPlayers[info.id] = {
      ...existing,
      bid: info.bid,
      lifes: info.lifes,
      mana: info.mana ?? existing.mana ?? null,
      points: info.rounds ?? existing.points ?? 0,
      ready: true,
      turnToPlay: info.id === gameInfo.current_player,
    };
  });
  return nextPlayers;
}

export function resolveCurrentPlayerId(playersById, currentPlayerId) {
  if (currentPlayerId && playersById[currentPlayerId]) return currentPlayerId;
  const players = Object.values(playersById);
  if (players.length === 1) return players[0].id;
  const savedPlayer = getSavedPlayer();
  const matchingPlayer = players.find((player) => {
    if (savedPlayer.nickname && player.nickname !== savedPlayer.nickname) return false;
    if (savedPlayer.avatarSrc && player.avatarSrc) {
      return player.avatarSrc === savedPlayer.avatarSrc;
    }
    return Boolean(savedPlayer.nickname);
  });
  return matchingPlayer?.id || currentPlayerId;
}

export function getPlayerLogName(playerId, playersById) {
  const player = playersById?.[playerId];
  return player?.nickname || player?.id || playerId || 'Guest';
}
