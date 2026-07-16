import { GAME_TYPES, getGameTypeOption } from '@/games/core/model/gameTypes.js';

export function getLobbyLifes(lobbyId, routeLifes) {
  const routeValue = Number(routeLifes);
  if (Number.isFinite(routeValue) && routeValue > 0) return routeValue;
  const savedValue = lobbyId ? Number(localStorage.getItem(`ohhell_lobby_lifes_${lobbyId}`)) : 0;
  return Number.isFinite(savedValue) && savedValue > 0 ? savedValue : 5;
}

export function getKnownLobbyGameType(lobbyId, routeGameType) {
  if (getGameTypeOption(routeGameType)) return routeGameType;
  const savedType = lobbyId ? localStorage.getItem(`ohhell_lobby_game_type_${lobbyId}`) : '';
  return getGameTypeOption(savedType) ? savedType : '';
}

export function getLobbyGameType(lobbyId, routeGameType) {
  return getKnownLobbyGameType(lobbyId, routeGameType) || GAME_TYPES.CLASSIC;
}

export function getLobbySummaryGameType(lobbyId, lobbies) {
  const lobby = (Array.isArray(lobbies) ? lobbies : []).find(
    (candidate) => (candidate?.id || candidate?.lobby_id || '') === lobbyId,
  );
  return getGameTypeOption(lobby?.game_type) ? lobby.game_type : '';
}

export function getLobbyCharacterId(lobbyId, routeCharacterId) {
  if (routeCharacterId) return routeCharacterId;
  return lobbyId ? localStorage.getItem(`ohhell_lobby_character_${lobbyId}`) || '' : '';
}

export function getLobbyPowerDeckId(lobbyId, routePowerDeckId) {
  if (routePowerDeckId) return routePowerDeckId;
  return lobbyId ? localStorage.getItem(`ohhell_lobby_power_deck_${lobbyId}`) || '' : '';
}

export function getLobbyLifeMultiplier(lobbyId, routeLifeMultiplier) {
  const routeValue = Number(routeLifeMultiplier);
  if (Number.isFinite(routeValue) && routeValue > 0) return routeValue;
  const savedValue = lobbyId
    ? Number(localStorage.getItem(`ohhell_lobby_power_life_multiplier_${lobbyId}`))
    : 0;
  return Number.isFinite(savedValue) && savedValue > 0 ? savedValue : 1;
}

export function getLobbyStatusMap(lobbyInfo) {
  if (lobbyInfo?.type === 'Waiting' || lobbyInfo?.type === 'NotStarted') {
    return lobbyInfo.data?.players || lobbyInfo.data;
  }
  if (lobbyInfo?.Waiting) return lobbyInfo.Waiting?.players || lobbyInfo.Waiting;
  if (lobbyInfo?.NotStarted) return lobbyInfo.NotStarted?.players || lobbyInfo.NotStarted;
  return null;
}

export function getLobbyGameInfo(lobbyInfo) {
  if (lobbyInfo?.type === 'Playing') return lobbyInfo.data;
  return lobbyInfo?.Playing || null;
}

export function getWaitingLobbySettings(container) {
  if (['Waiting', 'NotStarted', 'Playing'].includes(container?.type)) {
    return container.data?.settings || null;
  }
  return (
    container?.Waiting?.settings ||
    container?.NotStarted?.settings ||
    container?.Playing?.settings ||
    null
  );
}

export function getSnapshotStatusMap(snapshot) {
  if (snapshot?.type === 'Waiting') return snapshot.data?.players || snapshot.data;
  if (snapshot?.type === 'Playing') return snapshot.data?.players;
  if (snapshot?.Waiting) return snapshot.Waiting?.players || snapshot.Waiting;
  return snapshot?.Playing?.players || null;
}

export function getGameInfoFromSnapshot(snapshot) {
  if (snapshot?.type === 'Playing') return snapshot.data?.game;
  return snapshot?.Playing?.game || null;
}
