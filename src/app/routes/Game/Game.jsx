import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Crown, Link as LinkIcon, LogIn, Sparkles, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import heartIcon from '@/assets/icons/heart.png';
import bidTurnSound from '@/assets/sounds/bid.mp3';
import cardAnimationSound from '@/assets/sounds/card_animation.mp3';
import playerTurnSound from '@/assets/sounds/default.mp3';
import tableBackground from '@/assets/back.png';
import { avatars } from '@/components/auth/AvatarEditModal.jsx';
import { LoginCard } from '@/components/auth/LoginCard.jsx';
import { Button } from '@/components/ui/button.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.jsx';
import { useToast } from '@/app/provider.jsx';
import { getAuthToken } from '@/services/apiClient.js';
import {
  isMissingAuthTokenError,
  refreshAuthIfNeeded,
} from '@/services/authService.js';
import {
  createGameSocket,
  isWaitingLobbyInactiveClose,
  playTurn,
  putBid,
  selectMercenary,
  setPlayerReady,
  skipPowerPhase,
  usePowerCard,
} from '@/services/gameSocketService.js';
import { getPowerDecks } from '@/services/cardDefinitionsService.js';
import {
  deckTypes,
  getGamePreferences,
  subscribeToGamePreferences,
} from '@/services/gamePreferencesService.js';
import {
  gameTypes,
  getGameTypeOption,
} from '@/services/gameTypesService.js';
import { cn } from '@/lib/utils.js';
import {
  startHellHandHomeTheme,
  stopHellHandHomeTheme,
} from '@/services/hellHandAudioService.js';
import { getLobbies, joinLobby } from '@/services/lobbyService.js';
import { getMercenaries } from '@/services/mercenariesService.js';
import {
  getMercenarySubtitle,
  getMercenaryTitle,
  normalizeRemoteMercenaries,
} from '../Characters/characterData.js';

const MAX_TABLE_PLAYERS = 10;
const MAX_DISPLAYED_LIFES = 5;
const MAX_VISIBLE_SEAT_CARDS = 6;
const CURRENT_PLAYER_SEAT_LIFT = 2;
const ROUND_END_DELAY_MS = 1000;
const PILE_WEAK_CARD_DELAY_MS = 1000;
const LIFE_LOSS_HIGHLIGHT_DURATION_MS = 3600;
const LIFE_LOSS_HIGHLIGHT_THRESHOLD = 3;
const CLASSIC_TURN_DELAY_BASE_SECONDS = 20;
const POWER_TURN_DELAY_BASE_SECONDS = 30;
const TURN_DELAY_CARD_SECONDS = 2;
const TURN_DELAY_POWER_CARD_SECONDS = 5;
const WS_RECONNECT_DELAYS_MS = [100, 250, 500, 1000, 1500, 2500];
const spanishCardImages = import.meta.glob('/src/assets/cards/spanish/*.jpg', {
  eager: true,
  import: 'default',
});
const spanish8BitCardImages = import.meta.glob(
  '/src/assets/cards/spanish_8bit/*.png',
  {
    eager: true,
    import: 'default',
  },
);
const frenchCardImages = import.meta.glob('/src/assets/cards/french/*.png', {
  eager: true,
  import: 'default',
});
const cardBackImages = import.meta.glob('/src/assets/cards/back_cards/back_card*.png', {
  eager: true,
  import: 'default',
});
const defaultCardBack = cardBackImages['/src/assets/cards/back_cards/back_card.png'];
const rankToAsset = {
  Eight: '8',
  Eleven: '11',
  Five: '5',
  Four: '4',
  Nine: '9',
  One: '1',
  Seven: '7',
  Six: '6',
  Ten: '10',
  Three: '3',
  Twelve: '12',
  Two: '2',
};
const suitToAsset = {
  Clubs: 'paus',
  Cups: 'copas',
  Golds: 'ouro',
  Swords: 'espada',
};
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
const rankStrength = {
  Four: 0,
  Five: 1,
  Six: 2,
  Seven: 3,
  Ten: 4,
  Eleven: 5,
  Twelve: 6,
  One: 7,
  Two: 8,
  Three: 9,
};
const suitStrength = {
  Golds: 0,
  Swords: 1,
  Cups: 2,
  Clubs: 3,
};
const nextRank = {
  Eleven: 'Twelve',
  Five: 'Six',
  Four: 'Five',
  One: 'Two',
  Seven: 'Ten',
  Six: 'Seven',
  Ten: 'Eleven',
  Three: 'Four',
  Twelve: 'One',
  Two: 'Three',
};

function decodeTokenPayload(token) {
  if (!token) {
    return null;
  }

  try {
    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      '=',
    );

    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function getCurrentPlayerId() {
  const payload = decodeTokenPayload(getAuthToken());
  const user = payload?.user || payload;

  return getClaimsPlayerId(user) || payload?.id || payload?.email || null;
}

function getCardKey(card) {
  if (!card) {
    return '';
  }

  const rank = rankToAsset[card.rank];
  const suit = suitToAsset[card.suit];

  return rank && suit ? `${rank}${suit}` : '';
}

function getCardBackSrc(cardBack) {
  if (!cardBack) {
    return defaultCardBack;
  }

  return (
    cardBackImages[`/src/assets/cards/back_cards/${cardBack}.png`] ||
    defaultCardBack
  );
}

function getCardImageSrc(
  card,
  deckType = deckTypes.SPANISH,
  fallbackSrc = defaultCardBack,
) {
  const key = getCardKey(card);

  if (deckType === deckTypes.FRENCH) {
    return frenchCardImages[`/src/assets/cards/french/${key}.png`] || fallbackSrc;
  }

  if (deckType === deckTypes.SPANISH_8BIT) {
    return (
      spanish8BitCardImages[`/src/assets/cards/spanish_8bit/${key}.png`] ||
      spanishCardImages[`/src/assets/cards/spanish/${key}.jpg`] ||
      fallbackSrc
    );
  }

  return spanishCardImages[`/src/assets/cards/spanish/${key}.jpg`] || fallbackSrc;
}

function getCardLabel(card) {
  if (!card) {
    return '';
  }

  const rank = rankLabels[card.rank] || card.rank;
  const suit = suitLabels[card.suit] || card.suit;

  return `${rank} de ${suit}`;
}

function getCardStrength(card, upcard) {
  if (!card) {
    return Number.NEGATIVE_INFINITY;
  }

  const rankValue = rankStrength[card.rank] ?? -1;
  const suitValue = suitStrength[card.suit] ?? -1;
  const baseValue = rankValue * 10 + suitValue;

  return nextRank[upcard?.rank] === card.rank ? baseValue + 100 : baseValue;
}

function getTurnKey(turn) {
  return `${turn?.player_id || ''}:${getCardKey(turn?.card)}`;
}

function getStrongestTurn(pile, upcard) {
  return (pile || []).reduce((strongestTurn, turn) => {
    if (!strongestTurn) {
      return turn;
    }

    return getCardStrength(turn.card, upcard) >
      getCardStrength(strongestTurn.card, upcard)
      ? turn
      : strongestTurn;
  }, null);
}

function getAddedTurn(previousPile, nextPile) {
  const previousCounts = (previousPile || []).reduce((counts, turn) => {
    const key = getTurnKey(turn);
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});

  return (nextPile || []).find((turn) => {
    const key = getTurnKey(turn);
    const remainingCount = previousCounts[key] || 0;

    if (remainingCount) {
      previousCounts[key] = remainingCount - 1;
      return false;
    }

    return true;
  });
}

function playGameSound(soundSrc, volume) {
  const normalizedVolume = Math.max(0, Math.min(100, Number(volume) || 0));

  if (!normalizedVolume) {
    return;
  }

  const audio = new Audio(soundSrc);
  audio.volume = normalizedVolume / 100;
  audio.play().catch(() => {});
}

function getJokerLabel(upcard) {
  const jokerRank = nextRank[upcard?.rank];

  return jokerRank ? rankLabels[jokerRank] || jokerRank : '-';
}

function isSameCard(first, second) {
  return first?.rank === second?.rank && first?.suit === second?.suit;
}

function removeCardFromDeck(deck, card) {
  let wasRemoved = false;

  return deck.filter((deckCard) => {
    if (!wasRemoved && isSameCard(deckCard, card)) {
      wasRemoved = true;
      return false;
    }

    return true;
  });
}

function removePowerCardFromHand(cards, cardId) {
  let wasRemoved = false;

  return cards.filter((card) => {
    if (!wasRemoved && card.id === cardId) {
      wasRemoved = true;
      return false;
    }

    return true;
  });
}

function getRandomItem(items) {
  if (!items?.length) {
    return null;
  }

  return items[Math.floor(Math.random() * items.length)];
}

function resolveAvatarSrc(picture) {
  if (!picture) {
    return '';
  }

  const avatar = avatars.find((item) => {
    return item.picture === picture || item.id === picture || item.src === picture;
  });

  return avatar?.src || picture;
}

function getSavedPlayer() {
  const nickname = localStorage.getItem('ohhell_guest_nickname') || 'Guest';
  const avatarId = localStorage.getItem('ohhell_guest_avatar_id') || '';
  const avatar = avatars.find((item) => item.id === avatarId);

  return {
    avatarSrc: avatar?.src || '',
    nickname,
  };
}

function getLobbyLifes(lobbyId, routeLifes) {
  const normalizedRouteLifes = Number(routeLifes);

  if (Number.isFinite(normalizedRouteLifes) && normalizedRouteLifes > 0) {
    return normalizedRouteLifes;
  }

  if (lobbyId) {
    const savedLifes = Number(
      localStorage.getItem(`ohhell_lobby_lifes_${lobbyId}`),
    );

    if (Number.isFinite(savedLifes) && savedLifes > 0) {
      return savedLifes;
    }
  }

  return 5;
}

function getKnownLobbyGameType(lobbyId, routeGameType) {
  if (getGameTypeOption(routeGameType)) {
    return routeGameType;
  }

  if (lobbyId) {
    const savedGameType = localStorage.getItem(`ohhell_lobby_game_type_${lobbyId}`);

    if (getGameTypeOption(savedGameType)) {
      return savedGameType;
    }
  }

  return '';
}

function getLobbyGameType(lobbyId, routeGameType) {
  const knownGameType = getKnownLobbyGameType(lobbyId, routeGameType);

  if (knownGameType) {
    return knownGameType;
  }

  return gameTypes.FODINHA_CLASSIC;
}

function getLobbySummaryId(lobby) {
  return lobby?.id || lobby?.lobby_id || '';
}

function getLobbySummaryGameType(lobbyId, lobbies) {
  const lobby = (Array.isArray(lobbies) ? lobbies : []).find(
    (candidate) => getLobbySummaryId(candidate) === lobbyId,
  );

  return getGameTypeOption(lobby?.game_type) ? lobby.game_type : '';
}

function getLobbyCharacterId(lobbyId, routeCharacterId) {
  if (routeCharacterId) {
    return routeCharacterId;
  }

  if (lobbyId) {
    return localStorage.getItem(`ohhell_lobby_character_${lobbyId}`) || '';
  }

  return '';
}

function getLobbyPowerDeckId(lobbyId, routePowerDeckId) {
  if (routePowerDeckId) {
    return routePowerDeckId;
  }

  if (lobbyId) {
    return localStorage.getItem(`ohhell_lobby_power_deck_${lobbyId}`) || '';
  }

  return '';
}

function getClaimsPlayerId(player) {
  if (!player) {
    return null;
  }

  if (player.type === 'Anonymous') {
    return player.data?.id || null;
  }

  if (player.type === 'Google') {
    return player.data?.email || null;
  }

  return player.id || player.email || null;
}

function getClaimsNickname(player, fallbackId) {
  if (player?.type === 'Anonymous') {
    return player.data?.data?.nickname || player.data?.id || fallbackId;
  }

  if (player?.type === 'Google') {
    return (
      player.data?.nickname ||
      player.data?.name ||
      player.data?.email ||
      fallbackId
    );
  }

  return player?.data?.nickname || player?.name || player?.id || fallbackId;
}

function getClaimsPicture(player) {
  if (player?.type === 'Anonymous') {
    return player.data?.data?.picture || '';
  }

  if (player?.type === 'Google') {
    return player.data?.picture_override || player.data?.picture || '';
  }

  return player?.data?.picture || player?.picture || '';
}

function normalizePlayer({ bid = null, fallbackId, lifes, mercenaryId, player, ready }) {
  const id = getClaimsPlayerId(player) || fallbackId;
  const isCurrentPlayer = id && id === getCurrentPlayerId();
  const savedPlayer = isCurrentPlayer
    ? getSavedPlayer()
    : { avatarSrc: '', nickname: '' };

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

function createFallbackPlayer(id, lifes) {
  const isCurrentPlayer = id && id === getCurrentPlayerId();
  const savedPlayer = isCurrentPlayer
    ? getSavedPlayer()
    : { avatarSrc: '', nickname: '' };

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

function mergeLifesIntoPlayers(playersById, lifesByPlayer, defaultLifes, overrides = {}) {
  return Object.entries(lifesByPlayer || {}).reduce(
    (nextPlayers, [playerId, life]) => {
      const existing =
        nextPlayers[playerId] || createFallbackPlayer(playerId, defaultLifes);

      nextPlayers[playerId] = {
        ...existing,
        ...overrides,
        lifes: life,
      };

      return nextPlayers;
    },
    { ...playersById },
  );
}

function createGameEndSummary(lifesByPlayer, playersById, defaultLifes) {
  const lifeEntries = Object.entries(lifesByPlayer || {})
    .map(([playerId, life]) => [playerId, Number(life)])
    .filter(([, life]) => Number.isFinite(life));
  const maxLife = lifeEntries.length
    ? Math.max(...lifeEntries.map(([, life]) => life))
    : 0;
  const winnerIds =
    maxLife > 0
      ? lifeEntries
          .filter(([, life]) => life === maxLife)
          .map(([playerId]) => playerId)
      : [];
  const winners = winnerIds.map((playerId) => {
    const existing =
      playersById[playerId] || createFallbackPlayer(playerId, defaultLifes);

    return {
      ...existing,
      lifes: lifesByPlayer[playerId],
    };
  });
  const winnerNames = winners.map((player) => player.nickname || player.id);

  return {
    noWinners: winners.length === 0,
    winnerNames: winnerNames.join(', '),
    winners,
  };
}

function createLifeLossHighlight(lifesByPlayer, playersById, defaultLifes) {
  for (const [playerId, currentLifes] of Object.entries(lifesByPlayer || {})) {
    const player = playersById[playerId] || createFallbackPlayer(playerId, defaultLifes);
    const previousLifes = Number(player.lifes ?? currentLifes);
    const nextLifes = Number(currentLifes);
    const lost = previousLifes - nextLifes;

    if (Number.isFinite(lost) && lost >= LIFE_LOSS_HIGHLIGHT_THRESHOLD) {
      return {
        lost,
        player: {
          ...player,
          lifes: currentLifes,
        },
      };
    }
  }

  return null;
}

function normalizeStatusMap(statusMap, lifes, previousPlayers = {}) {
  return Object.entries(statusMap || {}).reduce((players, [id, status]) => {
    const previous = previousPlayers[id];
    const nextPlayer = normalizePlayer({
      bid: previous?.bid ?? null,
      fallbackId: id,
      lifes: previous?.lifes ?? lifes,
      player: status.player,
      ready: status.ready,
      mercenaryId: status.mercenary_id,
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

function getLobbyStatusMap(lobbyInfo) {
  if (lobbyInfo?.type === 'NotStarted') {
    return lobbyInfo.data?.players || lobbyInfo.data;
  }

  if (lobbyInfo?.NotStarted) {
    return lobbyInfo.NotStarted?.players || lobbyInfo.NotStarted;
  }

  return null;
}

function getLobbyGameInfo(lobbyInfo) {
  if (lobbyInfo?.type === 'Playing') {
    return lobbyInfo.data;
  }

  if (lobbyInfo?.Playing) {
    return lobbyInfo.Playing;
  }

  return null;
}

function getWaitingLobbySettings(container) {
  if (container?.type === 'Waiting') {
    return container.data?.settings || null;
  }

  if (container?.type === 'NotStarted') {
    return container.data?.settings || null;
  }

  if (container?.Waiting?.settings) {
    return container.Waiting.settings;
  }

  if (container?.NotStarted?.settings) {
    return container.NotStarted.settings;
  }

  return null;
}

function getSnapshotStatusMap(snapshot) {
  if (snapshot?.type === 'Waiting') {
    return snapshot.data?.players || snapshot.data;
  }

  if (snapshot?.type === 'Playing') {
    return snapshot.data?.players;
  }

  return null;
}

function getLobbyLifeMultiplier(lobbyId, routeLifeMultiplier) {
  const normalizedRouteMultiplier = Number(routeLifeMultiplier);

  if (Number.isFinite(normalizedRouteMultiplier) && normalizedRouteMultiplier > 0) {
    return normalizedRouteMultiplier;
  }

  if (lobbyId) {
    const savedMultiplier = Number(
      localStorage.getItem(`ohhell_lobby_power_life_multiplier_${lobbyId}`),
    );

    if (Number.isFinite(savedMultiplier) && savedMultiplier > 0) {
      return savedMultiplier;
    }
  }

  return 1;
}

function getGameInfoFromSnapshot(snapshot) {
  if (snapshot?.type === 'Playing') {
    return snapshot.data?.game;
  }

  return null;
}

function getLocalPlayerIdCandidates({
  currentPlayerId,
  gameInfo,
  localPlayerIds = [],
  playersById = {},
  statusMap,
}) {
  const tokenPlayerId = getCurrentPlayerId();
  const savedPlayer = getSavedPlayer();
  const candidates = [
    tokenPlayerId,
    currentPlayerId,
    ...localPlayerIds,
  ].filter(Boolean);

  Object.values(playersById).forEach((player) => {
    if (player?.id && player.id === tokenPlayerId) {
      candidates.push(player.id);
    }
  });

  Object.entries(statusMap || {}).forEach(([id, status]) => {
    const nickname = getClaimsNickname(status.player, id);
    const avatarSrc = resolveAvatarSrc(getClaimsPicture(status.player));

    if (tokenPlayerId && id === tokenPlayerId) {
      candidates.push(id);
      return;
    }

    if (!savedPlayer.nickname || nickname !== savedPlayer.nickname) {
      return;
    }

    if (savedPlayer.avatarSrc && avatarSrc && savedPlayer.avatarSrc !== avatarSrc) {
      return;
    }

    candidates.push(id);
  });

  const gamePlayerIds = new Set((gameInfo?.info || []).map((info) => info.id));

  return Array.from(new Set(candidates)).filter((id) => {
    return !gamePlayerIds.size || gamePlayerIds.has(id);
  });
}

function applyGameInfo(playersById, gameInfo, defaultLifes) {
  if (!gameInfo?.info) {
    return playersById;
  }

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

function sortPlayers(players, currentPlayerId) {
  return [...players].sort((first, second) => {
    if (first.id === currentPlayerId) {
      return -1;
    }

    if (second.id === currentPlayerId) {
      return 1;
    }

    return first.id.localeCompare(second.id);
  });
}

function hasPositiveLifes(player, defaultLifes) {
  const playerLifes = Number(player?.lifes ?? defaultLifes);

  return Number.isFinite(playerLifes) ? playerLifes > 0 : true;
}

function resolveCurrentPlayerId(playersById, currentPlayerId) {
  if (currentPlayerId && playersById[currentPlayerId]) {
    return currentPlayerId;
  }

  const players = Object.values(playersById);

  if (players.length === 1) {
    return players[0].id;
  }

  const savedPlayer = getSavedPlayer();
  const matchingSavedPlayer = players.find((player) => {
    if (savedPlayer.nickname && player.nickname !== savedPlayer.nickname) {
      return false;
    }

    if (savedPlayer.avatarSrc && player.avatarSrc) {
      return player.avatarSrc === savedPlayer.avatarSrc;
    }

    return Boolean(savedPlayer.nickname);
  });

  return matchingSavedPlayer?.id || currentPlayerId;
}

function getPlayedCountsByPlayer(pile) {
  return pile.reduce((counts, turn) => {
    counts[turn.player_id] = (counts[turn.player_id] || 0) + 1;
    return counts;
  }, {});
}

function getSeatCardCount({
  isCurrent,
  playerDeckLength,
  playerId,
  playedCountsByPlayer,
  roundCardCount,
}) {
  if (!roundCardCount) {
    return 0;
  }

  if (isCurrent) {
    return playerDeckLength;
  }

  return Math.max(0, roundCardCount - (playedCountsByPlayer[playerId] || 0));
}

function getSeatPosition(index, totalPlayers, isCurrentPlayer = false) {
  if (totalPlayers <= 1) {
    return {
      left: '50%',
      top: `${60 - (isCurrentPlayer ? CURRENT_PLAYER_SEAT_LIFT : 0)}%`,
    };
  }

  const angle = Math.PI / 2 + (index * 2 * Math.PI) / totalPlayers;
  const left = 50 + Math.cos(angle) * 36;
  const top =
    48 + Math.sin(angle) * 28 - (isCurrentPlayer ? CURRENT_PLAYER_SEAT_LIFT : 0);

  return {
    left: `${left.toFixed(2)}%`,
    top: `${top.toFixed(2)}%`,
  };
}

function ReadyControls({
  canToggleReady,
  hasEnoughPlayers,
  isPending,
  isReady,
  needsMercenarySelection,
  onToggleReady,
  readyCount,
  totalPlayers,
}) {
  const { t } = useTranslation();
  const buttonLabel = isPending ? t('game.readySending') : t('game.ready');
  const disabledTitle = !hasEnoughPlayers
    ? t('game.waitingForPlayersTitle')
    : needsMercenarySelection
    ? t('game.selectMercenaryTitle')
    : undefined;

  return (
    <div className="flex w-full flex-col items-stretch justify-center gap-2 rounded-2xl border border-white/10 bg-black/80 p-2 shadow-2xl shadow-black/50 backdrop-blur sm:w-auto sm:flex-row sm:items-center">
      <button
        type="button"
        disabled={!canToggleReady}
        title={disabledTitle}
        className={`h-11 rounded-xl border px-7 text-sm font-semibold shadow-lg transition sm:h-10 sm:rounded-full ${
          isReady
            ? 'border-emerald-400/70 bg-emerald-500 text-emerald-950 enabled:hover:bg-emerald-400'
            : 'border-white/15 bg-black/75 text-white enabled:hover:bg-black'
        } ${canToggleReady ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
        onClick={onToggleReady}
      >
        {buttonLabel}
      </button>

      <span className="rounded-xl border border-white/10 bg-black/75 px-4 py-2 text-center text-xs font-semibold text-white shadow-lg sm:rounded-full">
        {t('game.playersReady', { readyCount, totalPlayers })}
      </span>
    </div>
  );
}

function WaitingPowerLobbyInfo({ deckInfo, deckKind, deckName, lifeMultiplier }) {
  const { t } = useTranslation();
  const KindIcon = deckKind === 'official' ? Crown : Sparkles;
  const kindLabel =
    deckKind === 'official'
      ? t('pages.createGame.powerDeckGroupOfficial')
      : t('pages.createGame.powerDeckGroupCommunity');

  return (
    <div className="absolute left-1/2 top-20 z-20 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 rounded-2xl border border-violet-300/25 bg-black/82 px-4 py-3 text-center text-white shadow-2xl shadow-black/40 backdrop-blur">
      <p className="text-[0.68rem] font-black uppercase tracking-[0.2em] text-violet-200/85">
        {t('game.powerLobbySettings')}
      </p>
      <p className="mt-2 text-sm font-semibold leading-6 text-stone-200">
        {t('game.lifeMultiplierDisplay', {
          multiplier: `${Number(lifeMultiplier || 1).toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })}x`,
        })}
      </p>
      {deckName ? (
        <div className="mt-3 rounded-xl border border-white/10 bg-black/45 px-3 py-2 text-left">
          <p className="text-[0.68rem] font-black uppercase tracking-[0.18em] text-violet-200/80">
            {t('game.selectedDeckLabel')}
          </p>
          <div className="mt-2 flex items-center justify-between gap-3">
            <strong className="truncate text-sm text-white">{deckName}</strong>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 px-2 py-1 text-[0.68rem] font-black uppercase tracking-[0.12em] text-stone-200">
              <KindIcon className="size-3" />
              {kindLabel}
            </span>
          </div>
          {deckInfo ? (
            <p className="mt-1 text-xs text-stone-400">{deckInfo}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ReadyStatusBadge({ isReady }) {
  const { t } = useTranslation();

  return (
    <div
      className={`absolute left-1/2 top-full mt-3 -translate-x-1/2 rounded-full border px-3 py-2 text-xs font-semibold shadow-lg ${
        isReady
          ? 'border-emerald-400/50 bg-emerald-500 text-emerald-950'
          : 'border-white/10 bg-black/75 text-white'
      }`}
    >
      {isReady ? t('game.ready') : t('game.waiting')}
    </div>
  );
}

function SeatCardBacks({ cardBackSrc, count }) {
  const cardCount = Math.max(0, Number(count) || 0);

  if (!cardCount) {
    return null;
  }

  const visibleCards = Math.min(cardCount, MAX_VISIBLE_SEAT_CARDS);

  return (
    <div className="absolute left-28 top-0 z-0 flex h-16 -translate-y-7 items-start overflow-hidden pr-4">
      {Array.from({ length: visibleCards }).map((_, cardIndex) => (
        <img
          key={cardIndex}
          src={cardBackSrc}
          alt=""
          className="-ml-6 h-19 w-[3.2rem] rounded-md border-2 border-black object-cover shadow-lg shadow-black/35 first:ml-0"
          draggable="false"
        />
      ))}
      {cardCount > visibleCards ? (
        <span className="-ml-5 mt-8 rounded-full border border-white/15 bg-black/85 px-2 py-1 text-[0.65rem] font-bold text-white shadow-lg">
          +{cardCount - visibleCards}
        </span>
      ) : null}
    </div>
  );
}

function BidProgress({ bid, points }) {
  const { t } = useTranslation();
  const numericBid = Number(bid);
  const numericPoints = Number(points);
  const bidCount = Number.isFinite(numericBid)
    ? Math.max(0, Math.trunc(numericBid))
    : 0;
  const completedCount = Number.isFinite(numericPoints)
    ? Math.max(0, Math.trunc(numericPoints))
    : 0;
  const visibleCount = Math.max(bidCount, completedCount);

  if (visibleCount <= 0) {
    return null;
  }

  return (
    <div className="relative z-20 mt-1 flex flex-wrap items-center justify-start gap-1">
      {Array.from({ length: visibleCount }).map((_, index) => {
        const isChecked = index < completedCount;
        const isExtraPoint = index >= bidCount;

        return (
          <input
            type="checkbox"
            checked={isChecked}
            readOnly
            key={index}
            aria-label={
              isExtraPoint
                ? t('game.extraPointDone', { number: index - bidCount + 1 })
                : t(isChecked ? 'game.bidDone' : 'game.bidPending', {
                    number: index + 1,
                  })
            }
            className={`size-6 appearance-none rounded border shadow-md shadow-black/35 ${
              isChecked
                ? 'border-emerald-300 bg-emerald-400'
                : 'border-white/30 bg-black/75'
            }`}
          />
        );
      })}
    </div>
  );
}

function LifeHearts({ lifes }) {
  const { t } = useTranslation();
  const totalLives = Number.isFinite(Number(lifes))
    ? Math.max(0, Math.trunc(Number(lifes)))
    : 0;
  const visibleLives = Math.min(MAX_DISPLAYED_LIFES, totalLives);
  const label = t('game.lives', { count: totalLives });

  return (
    <div className="mt-1 flex items-center gap-0.5" aria-label={label}>
      {Array.from({ length: visibleLives }).map((_, index) => (
        <img
          key={index}
          src={heartIcon}
          alt=""
          className="size-4 object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] sm:size-5"
          draggable="false"
        />
      ))}
      {totalLives > MAX_DISPLAYED_LIFES ? (
        <span className="ml-1 text-xs font-black leading-none text-red-100 sm:text-sm">
          x{totalLives}
        </span>
      ) : null}
    </div>
  );
}

function ManaPool({ mana }) {
  const { t } = useTranslation();
  const current = Math.max(0, Math.trunc(Number(mana?.current) || 0));
  const max = Math.max(0, Math.trunc(Number(mana?.max) || 0));

  if (!max) {
    return null;
  }

  return (
    <div
      className="mt-1 flex items-center gap-1"
      aria-label={t('game.manaValue', { current, max })}
    >
      <span className="h-2 w-16 overflow-hidden rounded-full bg-sky-950/80 ring-1 ring-sky-200/20">
        <span
          className="block h-full rounded-full bg-gradient-to-r from-sky-300 to-cyan-200"
          style={{ width: `${max ? Math.min(100, (current / max) * 100) : 0}%` }}
        />
      </span>
      <span className="text-[0.65rem] font-black uppercase tracking-wide text-sky-100">
        {current}/{max}
      </span>
    </div>
  );
}

function useTimerNow(timer) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!timer) {
      return undefined;
    }

    setNow(Date.now());
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 200);

    return () => window.clearInterval(interval);
  }, [timer]);

  return now;
}

function getTimerSnapshot(timer, now) {
  if (!timer) {
    return {
      elapsedMs: 0,
      progress: 0,
      remainingMs: 0,
      seconds: 0,
    };
  }

  const elapsedMs = Math.max(0, now - timer.startedAt);
  const remainingMs = Math.max(0, timer.durationMs - elapsedMs);
  const progress = timer.durationMs
    ? Math.max(0, Math.min(100, (remainingMs / timer.durationMs) * 100))
    : 0;

  return {
    elapsedMs,
    progress,
    remainingMs,
    seconds: Math.ceil(remainingMs / 1000),
  };
}

function PlayerSeat({
  avatarSrc,
  cardBackSrc,
  bid = null,
  cardCount = 0,
  canDropPowerCard = false,
  draggingPowerCard = null,
  isCurrent = false,
  isReady = false,
  isTurnToPlay = false,
  lifes,
  mana,
  nickname,
  onPowerCardDrop = null,
  position,
  points,
  readyControls = null,
  showReadyState = false,
  turnTimer = null,
}) {
  const scaleClass = isCurrent ? 'scale-90' : 'scale-75';
  const isPowerDropActive = canDropPowerCard && draggingPowerCard?.type === 'targetable';
  const timerNow = useTimerNow(turnTimer);
  const timerProgress = getTimerSnapshot(turnTimer, timerNow).progress;
  const showTurnTimer = Boolean(isTurnToPlay && turnTimer);
  const avatarBorderClass = isPowerDropActive
    ? 'border-violet-200 ring-4 ring-violet-300/55'
    : isTurnToPlay
    ? 'border-violet-400 ring-4 ring-violet-500/45'
    : 'border-white/20 ring-0';
  const handleAvatarDragOver = (event) => {
    if (!isPowerDropActive) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };
  const handleAvatarDrop = (event) => {
    if (!isPowerDropActive) {
      return;
    }

    event.preventDefault();
    onPowerCardDrop?.();
  };

  return (
    <div
      className={`absolute z-10 w-[min(19.8rem,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2 ${scaleClass} sm:w-[21.6rem]`}
      style={position}
    >
      <SeatCardBacks cardBackSrc={cardBackSrc} count={cardCount} />

      <div className="relative z-10 flex items-center">
        <div
          className="relative z-20 grid size-[6.6rem] shrink-0 place-items-center sm:size-[7.7rem]"
          onDragOver={handleAvatarDragOver}
          onDrop={handleAvatarDrop}
        >
          {showTurnTimer ? (
            <span
              aria-hidden="true"
              className="absolute -inset-2 rounded-full opacity-95 transition-[background] duration-200 ease-linear"
              style={{
                background: `conic-gradient(#fbbf24 ${timerProgress}%, rgba(139, 92, 246, 0.18) ${timerProgress}% 100%)`,
                mask: 'radial-gradient(farthest-side, transparent calc(100% - 7px), #000 calc(100% - 6px))',
                WebkitMask:
                  'radial-gradient(farthest-side, transparent calc(100% - 7px), #000 calc(100% - 6px))',
              }}
            />
          ) : null}

          <div
            className={`relative grid size-full place-items-center overflow-hidden rounded-full border-[3px] ${avatarBorderClass} bg-black shadow-2xl shadow-black/60`}
          >
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt=""
                className="size-full scale-110 object-cover"
                draggable="false"
              />
            ) : (
              <UserRound className="size-11 text-zinc-300 sm:size-12" />
            )}
          </div>
        </div>

        <div
          className="-ml-5 flex min-h-20 flex-1 items-center justify-between gap-3 rounded-[2rem] bg-zinc-900/95 py-4 pl-9 pr-4 text-white shadow-2xl shadow-black/55 ring-1 ring-white/10 backdrop-blur-sm sm:min-h-24 sm:pl-11"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-5 sm:text-base">
              {nickname}
            </p>
            <LifeHearts lifes={lifes} />
            <ManaPool mana={mana} />
            <BidProgress bid={bid} points={points} />
          </div>

          <div
            aria-label="Bid escolhido"
            className="grid h-11 min-w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-black/45 px-3 text-base font-bold text-white shadow-inner shadow-black/40 sm:h-12 sm:min-w-12"
          >
            {bid ?? '-'}
          </div>
        </div>
      </div>

      {showReadyState && isCurrent && readyControls ? (
        <div className="absolute left-1/2 top-full z-30 mt-3 w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 sm:w-auto">
          {readyControls}
        </div>
      ) : null}

      {showReadyState && !isCurrent ? <ReadyStatusBadge isReady={isReady} /> : null}
    </div>
  );
}

function TableCenter({
  cardBackSrc,
  deckType,
  elevatedPileCardKey,
  pile,
  playersById,
  upcard,
}) {
  const { t } = useTranslation();

  if (!upcard && pile.length === 0) {
    return null;
  }

  const deckBackCards = Array.from({ length: 4 });
  const pileCardSizeClass =
    deckType === deckTypes.FRENCH
      ? 'h-[8.35rem] w-[5.75rem] sm:h-[10.16rem] sm:w-[7rem]'
      : 'h-[8.35rem] w-[5.56rem] sm:h-[10.16rem] sm:w-[6.76rem]';
  const visualPile = [...pile]
    .map((turn, index) => ({
      index,
      isElevated: elevatedPileCardKey === getTurnKey(turn),
      strength: getCardStrength(turn.card, upcard),
      turn,
    }))
    .sort((first, second) => {
      if (first.isElevated !== second.isElevated) {
        return first.isElevated ? 1 : -1;
      }

      if (first.strength !== second.strength) {
        return first.strength - second.strength;
      }

      return first.index - second.index;
    });

  return (
    <div className="absolute left-1/2 top-1/2 z-0 flex w-[min(35rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-5 p-4 text-white sm:gap-8">
      {upcard ? (
        <div className="grid justify-items-center gap-1">
          <div
            aria-label={t('game.deckAndJoker')}
            className="relative h-[7.99rem] w-[5.32rem] [--deck-gap:0.67rem] sm:h-[10.65rem] sm:w-[7.18rem] sm:[--deck-gap:0.97rem]"
          >
            {deckBackCards.map((_, index) => (
              <img
                key={`deck-back-${index}`}
                src={cardBackSrc}
                alt=""
                aria-hidden="true"
                className="absolute left-0 top-0 h-[7.99rem] w-[5.32rem] rounded-lg border-2 border-black object-cover shadow-xl shadow-black/50 sm:h-[10.65rem] sm:w-[7.18rem]"
                draggable="false"
                style={{
                  transform: `translateX(calc(var(--deck-gap) * -${deckBackCards.length - index}))`,
                  zIndex: index + 1,
                }}
              />
            ))}
            <img
              src={getCardImageSrc(upcard, deckType, cardBackSrc)}
              alt={getCardLabel(upcard)}
              className="absolute left-0 top-0 h-[7.99rem] w-[5.32rem] rounded-lg border-2 border-black object-cover shadow-xl shadow-black/50 sm:h-[10.65rem] sm:w-[11.58rem]"
              draggable="false"
              style={{
                zIndex: deckBackCards.length + 1,
              }}
            />
          </div>
        </div>
      ) : null}

      <div className="grid min-w-28 justify-items-center gap-2">
        <div className="relative h-[7.7rem] w-[8.8rem] translate-y-[20%] sm:h-[9.9rem] sm:w-[12.1rem]">
          {visualPile.length ? (
            visualPile.map(({ isElevated, turn }, index) => {
              const playerName =
                playersById[turn.player_id]?.nickname || turn.player_id;

              return (
                <img
                  key={getTurnKey(turn)}
                  src={getCardImageSrc(turn.card, deckType, cardBackSrc)}
                  alt={`${playerName}: ${getCardLabel(turn.card)}`}
                  title={`${playerName}: ${getCardLabel(turn.card)}`}
                  className={`absolute left-1/2 top-1/2 ${pileCardSizeClass} -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-black bg-white object-contain shadow-xl shadow-black/60 transition-transform duration-500 ease-out`}
                  draggable="false"
                  style={{
                    transform: `translate(-50%, -50%) translateX(${index * 22}px) rotate(${index * 5 - 8}deg)`,
                    zIndex: isElevated ? visualPile.length + 10 : index + 1,
                  }}
                />
              );
            })
          ) : null}
        </div>
      </div>
    </div>
  );
}

function BidControls({ onBid, possibleBids }) {
  if (!possibleBids.length) {
    return null;
  }

  return (
    <div className="absolute bottom-40 left-1/2 z-40 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap justify-center gap-2 rounded-2xl border border-white/10 bg-black/80 p-3 shadow-2xl shadow-black/50 backdrop-blur sm:bottom-73">
      {possibleBids.map((bid) => (
        <button
          key={bid}
          type="button"
          className="size-12 cursor-pointer rounded-xl border border-amber-300/50 bg-amber-400 text-base font-black text-zinc-950 shadow-lg shadow-black/30 transition hover:bg-amber-300"
          onClick={() => onBid(bid)}
        >
          {bid}
        </button>
      ))}
    </div>
  );
}

function ActionTimer({ onExpire, timer }) {
  const { t } = useTranslation();
  const now = useTimerNow(timer);
  const expiredTimerIdRef = useRef('');

  useEffect(() => {
    expiredTimerIdRef.current = '';
  }, [timer?.id]);

  useEffect(() => {
    if (!timer) {
      return;
    }

    const remainingMs = timer.durationMs - Math.max(0, now - timer.startedAt);

    if (remainingMs > 0 || expiredTimerIdRef.current === timer.id) {
      return;
    }

    expiredTimerIdRef.current = timer.id;
    onExpire?.(timer);
  }, [now, onExpire, timer]);

  if (!timer) {
    return null;
  }

  const { progress, remainingMs, seconds } = getTimerSnapshot(timer, now);
  const label =
    timer.type === 'bid'
      ? t('game.timerBid')
      : timer.type === 'cards'
        ? t('game.timerCards')
        : timer.type === 'power'
          ? t('game.timerPower')
          : t('game.timerPlay');

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-4 z-50 w-[min(24rem,calc(100vw-5rem))] -translate-x-1/2 rounded-full border border-white/15 bg-black/80 px-3 py-2 text-white shadow-2xl shadow-black/50 backdrop-blur"
      aria-live="polite"
    >
      <div className="mb-1 flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wide">
        <span>{label}</span>
        <span>{seconds}s</span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-white/15">
        <span
          className="absolute bottom-0 right-0 top-0 rounded-full bg-amber-300 transition-[width] duration-200 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function RoomLinkCopy({ lobbyId }) {
  const { t } = useTranslation();
  const [wasCopied, setWasCopied] = useState(false);
  const roomLink = `${window.location.origin}/game/${lobbyId}`;

  const copyRoomLink = async () => {
    try {
      await navigator.clipboard.writeText(roomLink);
      setWasCopied(true);
      window.setTimeout(() => setWasCopied(false), 1600);
    } catch {
      setWasCopied(false);
    }
  };

  return (
    <div className="absolute left-1/2 top-4 z-40 flex w-[min(28rem,calc(100vw-5rem))] -translate-x-1/2 items-center gap-2 rounded-full border border-white/15 bg-black/80 p-2 text-white shadow-2xl shadow-black/50 backdrop-blur">
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-wide">
        <LinkIcon className="size-3.5" />
        {t('common.link')}
      </span>
      <input
        type="text"
        value={roomLink}
        readOnly
        aria-label={t('game.roomLink')}
        className="min-w-0 flex-1 bg-transparent text-xs font-semibold text-zinc-200 outline-none"
      />
      <button
        type="button"
        aria-label={t('game.copyRoomLink')}
        className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-amber-300 text-zinc-950 transition hover:bg-amber-200"
        onClick={copyRoomLink}
      >
        {wasCopied ? <Check className="size-4" /> : <Copy className="size-4" />}
      </button>
    </div>
  );
}

function PlayedCardAnimation({ card, cardBackSrc, deckType, onAnimationEnd }) {
  if (!card) {
    return null;
  }

  return (
    <img
      src={getCardImageSrc(card, deckType, cardBackSrc)}
      alt=""
      className="ohhell-card-play-animation absolute bottom-8 left-1/2 z-50 h-[8.47rem] w-[5.72rem] rounded-lg border-2 border-black object-cover shadow-2xl shadow-black/70 sm:h-[10.89rem] sm:w-[7.26rem]"
      draggable="false"
      onAnimationEnd={onAnimationEnd}
    />
  );
}

function GameEndedOverlay({ onBackToMenu, summary }) {
  const { t } = useTranslation();

  if (!summary) {
    return null;
  }

  return (
    <div className="ohhell-game-ended-overlay fixed inset-0 z-[80] grid place-items-center px-4 py-6 text-white">
      <section
        className={`ohhell-game-ended-card relative w-[min(35rem,calc(100vw-2rem))] overflow-hidden rounded-3xl border-2 px-5 py-7 text-center shadow-2xl sm:px-8 sm:py-8 ${
          summary.noWinners ? 'ohhell-game-ended-card--empty' : ''
        }`}
        aria-live="polite"
      >
        <div className="relative z-10 mb-2 text-xs font-black uppercase tracking-[0.28em] text-amber-200">
          {t('game.gameEnded')}
        </div>

        {summary.noWinners ? (
          <>
            <h1 className="relative z-10 m-0 text-[clamp(2.4rem,14vw,5.6rem)] font-black leading-none text-zinc-100 drop-shadow-2xl">
              {t('game.noWinners')}
            </h1>
            <div className="ohhell-no-winners-mark relative z-10 mx-auto my-5 grid size-24 place-items-center rounded-full border-[3px] border-white/35 text-6xl font-black text-white/85 sm:size-[6.5rem]">
              0
            </div>
            <p className="relative z-10 m-0 text-sm font-medium text-zinc-200/85 sm:text-base">
              {t('game.everyoneRanOut')}
            </p>
          </>
        ) : (
          <>
            <h1 className="relative z-10 m-0 text-[clamp(2.5rem,14vw,5.6rem)] font-black leading-none text-amber-50 drop-shadow-2xl">
              {summary.winners.length > 1 ? t('game.winners') : t('game.winner')}
            </h1>
            <div className="relative z-10 mt-6 flex flex-wrap justify-center gap-3">
              {summary.winners.map((winner) => (
                <div
                  key={winner.id}
                  className="ohhell-winner-avatar grid size-20 place-items-center overflow-hidden rounded-full border-[3px] border-amber-300 bg-black shadow-2xl shadow-amber-500/20 sm:size-24"
                >
                  {winner.avatarSrc ? (
                    <img
                      src={winner.avatarSrc}
                      alt=""
                      className="size-full object-cover"
                      draggable="false"
                    />
                  ) : (
                    <UserRound className="size-10 text-amber-100 sm:size-12" />
                  )}
                </div>
              ))}
            </div>
            <h2 className="relative z-10 mt-4 break-words text-[clamp(1.35rem,6vw,2.5rem)] font-black leading-tight text-amber-100">
              {summary.winnerNames}
            </h2>
            <p className="relative z-10 m-0 text-sm font-medium text-amber-50/80 sm:text-base">
              {t('game.lastPlayerStanding')}
            </p>
          </>
        )}

        <Button
          type="button"
          className="relative z-10 mt-6 h-11 rounded-full border-0 bg-amber-300 px-6 font-black text-zinc-950 shadow-lg shadow-black/35 hover:bg-amber-200"
          onClick={onBackToMenu}
        >
          {t('game.backToMenu')}
        </Button>
      </section>
    </div>
  );
}

function LifeLossPopup({ highlight }) {
  const { t } = useTranslation();

  if (!highlight) {
    return null;
  }

  const player = highlight.player || {};

  return (
    <div className="ohhell-life-loss-popup pointer-events-none flex w-[min(22rem,calc(100vw-1.5rem))] items-center gap-3 overflow-hidden rounded-3xl border border-red-300/35 bg-zinc-950/95 p-3 text-white shadow-2xl shadow-red-950/45 backdrop-blur">
      <div className="ohhell-life-loss-burst" aria-hidden="true" />
      <div className="relative z-10 grid size-14 shrink-0 place-items-center overflow-hidden rounded-full border-2 border-red-200 bg-black shadow-lg shadow-red-500/25 sm:size-16">
        {player.avatarSrc ? (
          <img
            src={player.avatarSrc}
            alt=""
            className="size-full object-cover"
            draggable="false"
          />
        ) : (
          <UserRound className="size-8 text-red-100" />
        )}
      </div>
      <div className="relative z-10 min-w-0">
        <span className="block text-[0.68rem] font-black uppercase tracking-[0.22em] text-red-200">
          {t('game.lifeLossEvent')}
        </span>
        <strong className="block truncate text-base font-black leading-tight text-white sm:text-lg">
          {player.nickname || player.id || 'Guest'}
        </strong>
        <small className="block text-xs font-bold text-red-100/85 sm:text-sm">
          {t('game.lostLives', { count: highlight.lost })}
        </small>
      </div>
    </div>
  );
}

function PlayerHand({ canPlayCards, cardBackSrc, cards, deckType, onPlayCard }) {
  if (!cards.length) {
    return null;
  }

  const isFrenchDeck = deckType === deckTypes.FRENCH;
  const overlapClass = isFrenchDeck
    ? cards.length >= 16
      ? 'ml-[-3.25rem] sm:ml-[-4.06rem]'
      : cards.length >= 12
        ? 'ml-[-2.75rem] sm:ml-[-3.17rem]'
        : 'ml-[-2.25rem] sm:ml-[-1.24rem]'
    : cards.length >= 16
      ? 'ml-[-3.7rem] sm:ml-[-4.51rem]'
      : cards.length >= 12
        ? 'ml-[-3.1rem] sm:ml-[-3.52rem]'
        : 'ml-[-2.5rem] sm:ml-[-1.38rem]';
  const cardSizeClass = isFrenchDeck
    ? 'h-[9.22rem] w-[6.35rem] sm:h-[9.8rem] sm:w-[6.75rem]'
    : 'h-[10.25rem] w-[6.82rem] sm:h-[10.89rem] sm:w-[7.26rem]';

  return (
    <div className="absolute bottom-1 left-1/2 z-40 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 translate-y-[10%] items-end justify-start overflow-x-auto px-2 pb-3 sm:bottom-3 sm:max-w-[min(92vw,82rem)] sm:justify-center sm:overflow-visible sm:px-0">
      <div className="flex w-max shrink-0 items-end justify-center gap-0">
        {cards.map((card, index) => (
          <button
            key={`${getCardKey(card)}-${index}`}
            type="button"
            disabled={!canPlayCards}
            title={getCardLabel(card)}
            className={`shrink-0 sm:scale-110 ${index === 0 ? '' : overlapClass} ${
              canPlayCards
                ? 'cursor-pointer active:-translate-y-3 sm:hover:-translate-y-6 sm:hover:scale-125'
                : 'cursor-not-allowed opacity-98'
            } transition duration-200`}
            onClick={() => onPlayCard(card)}
          >
            <img
              src={getCardImageSrc(card, deckType, cardBackSrc)}
              alt={getCardLabel(card)}
              className={`${cardSizeClass} rounded-lg border-2 border-black bg-white object-contain shadow-2xl shadow-black/60`}
              draggable="false"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function PowerCardHand({
  canSkipPowerPhase,
  canUsePowerCards,
  cards,
  onPowerCardDragEnd,
  onPowerCardDragStart,
  onSkipPowerPhase,
  onUsePowerCard,
}) {
  const { t } = useTranslation();

  if (!cards.length && !canSkipPowerPhase) {
    return null;
  }

  return (
    <div className="absolute bottom-[11.25rem] left-1/2 z-40 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 gap-2 overflow-x-auto px-2 pb-2 sm:bottom-[13.75rem] sm:max-w-[min(92vw,56rem)] sm:justify-center sm:overflow-visible sm:px-0">
      {cards.map((card, index) => {
        const isTargetable = card.type === 'targetable';
        const cardReady = card?.state?.ready !== false;
        const canUseCard = canUsePowerCards && cardReady;
        const canDrag = canUseCard && isTargetable;

        return (
          <button
            key={`${card.id}-${index}`}
            type="button"
            disabled={!canUseCard}
            draggable={canDrag}
            title={
              !cardReady
                ? card.state?.reason || card.description || card.name
                : isTargetable
                ? t('game.powerCardDragToTarget')
                : card.description || card.name
            }
            className={`min-w-36 shrink-0 rounded-2xl border border-violet-200/40 bg-violet-950/90 px-4 py-3 text-left text-white shadow-2xl shadow-black/50 backdrop-blur transition sm:min-w-44 ${
              canUseCard
                ? isTargetable
                  ? 'cursor-grab hover:-translate-y-1 hover:border-violet-200 active:cursor-grabbing active:translate-y-0'
                  : 'cursor-pointer hover:-translate-y-1 hover:border-violet-200 active:translate-y-0'
                : 'cursor-not-allowed opacity-70'
            }`}
            onClick={() => {
              if (canUseCard && !isTargetable) {
                onUsePowerCard(card);
              }
            }}
            onDragEnd={onPowerCardDragEnd}
            onDragStart={(event) => {
              if (!canDrag) {
                event.preventDefault();
                return;
              }

              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData('text/plain', card.id);
              onPowerCardDragStart(card);
            }}
          >
            <span className="block text-[0.62rem] font-black uppercase tracking-[0.22em] text-violet-200">
              {t('game.powerCard')}
            </span>
            <strong className="mt-1 block truncate text-sm font-black sm:text-base">
              {card.name}
            </strong>
            <small className="mt-1 block max-h-8 overflow-hidden text-xs font-semibold text-violet-100/80">
              {card.description}
            </small>
            <span className="mt-2 inline-flex rounded-full border border-sky-200/30 bg-sky-300/10 px-2 py-0.5 text-[0.62rem] font-black uppercase tracking-[0.18em] text-sky-100">
              {t('game.mana')}: {card.mana_cost ?? card.manaCost ?? 0}
            </span>
            {isTargetable ? (
              <span className="mt-2 block text-[0.62rem] font-black uppercase tracking-[0.18em] text-violet-200/80">
                {t('game.dragToTarget')}
              </span>
            ) : null}
          </button>
        );
      })}
      {canSkipPowerPhase ? (
        <Button
          type="button"
          className="min-h-24 shrink-0 rounded-2xl border border-amber-200/40 bg-black/80 px-5 py-3 text-sm font-black uppercase tracking-[0.18em] text-amber-100 shadow-2xl shadow-black/50 transition hover:-translate-y-1 hover:border-amber-200 hover:bg-black"
          onClick={onSkipPowerPhase}
        >
          {t('game.skipPowerPhase')}
        </Button>
      ) : null}
    </div>
  );
}

function LobbyAuthGate({
  canContinue,
  error,
  gameType,
  isConfirming,
  onContinue,
  onProfileSaved,
  onProfileStateChange,
  open,
  profileCardRef,
}) {
  const { t } = useTranslation();
  const isHellHand = gameType === gameTypes.FODINHA_POWER;

  return (
    <Dialog open={open}>
      <DialogContent
        className={cn(
          'pointer-events-auto z-[70] max-w-md p-5 text-white shadow-2xl shadow-black/50',
          isHellHand
            ? 'border-red-200/15 bg-black/92 text-stone-100'
            : 'border-white/10 bg-zinc-950/95',
        )}
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className={cn(isHellHand && 'text-amber-100')}>
            {t('game.enterRoom')}
          </DialogTitle>
          <DialogDescription className={cn(isHellHand && 'text-red-100/70')}>
            {t('game.confirmProfile')}
          </DialogDescription>
        </DialogHeader>

        <LoginCard
          ref={profileCardRef}
          compact={isHellHand}
          variant={isHellHand ? 'hellHand' : 'default'}
          className={cn(
            'shadow-none',
            isHellHand ? 'border-red-200/15 bg-black/45' : 'border-white/10 bg-black/30 p-5',
          )}
          onProfileStateChange={onProfileStateChange}
          onSaved={onProfileSaved}
        />

        {error ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter
          className={cn(
            '-mx-5 -mb-5 px-5',
            isHellHand ? 'border-red-200/15 bg-red-950/20' : 'border-white/10 bg-black/30',
          )}
        >
          <Button
            type="button"
            disabled={!canContinue || isConfirming}
            className={cn(
              'h-11 w-full gap-2 sm:w-auto',
              isHellHand && 'border border-amber-200/40 bg-amber-300 text-black hover:bg-amber-200',
            )}
            onClick={onContinue}
          >
            {isConfirming ? (
              <i className="pi pi-spin pi-spinner text-sm" />
            ) : (
              <LogIn className="size-4" />
            )}
            {isConfirming ? t('game.enteringRoom') : t('game.enterRoom')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function HellHandMercenaryJoinGate({
  characters,
  error,
  isLoading,
  onRetry,
  onSelect,
  open,
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open}>
      <DialogContent
        className="pointer-events-auto z-[70] max-h-[min(44rem,calc(100dvh-2rem))] max-w-3xl overflow-hidden border-red-200/15 bg-black/92 p-0 text-stone-100 shadow-2xl shadow-black/55"
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <div className="border-b border-red-200/12 bg-red-950/20 px-5 py-4">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-amber-100">
              {t('game.chooseMercenaryTitle')}
            </DialogTitle>
            <DialogDescription className="text-red-100/70">
              {t('game.chooseMercenaryDescription')}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="max-h-[min(32rem,calc(100dvh-13rem))] overflow-y-auto px-5 py-4">
          {isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="h-32 animate-pulse rounded-lg border border-red-200/10 bg-red-950/20"
                />
              ))}
            </div>
          ) : characters.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {characters.map((character) => {
                const title = getMercenaryTitle(character, t);
                const subtitle = getMercenarySubtitle(character, t);
                const imageSrc = character.icon || character.banner;

                return (
                  <button
                    key={character.id}
                    type="button"
                    aria-label={t('pages.characters.chooseCharacter', {
                      name: title,
                    })}
                    className="group grid min-h-32 cursor-pointer grid-cols-[5.5rem_1fr] overflow-hidden rounded-lg border border-red-200/15 bg-black/70 text-left shadow-lg shadow-black/35 outline-none transition hover:border-amber-300/60 hover:bg-red-950/35 focus-visible:ring-2 focus-visible:ring-amber-300"
                    onClick={() => onSelect(character.id)}
                  >
                    <span className="relative block size-full min-h-32 overflow-hidden bg-red-950/35">
                      {imageSrc ? (
                        <img
                          src={imageSrc}
                          alt=""
                          className="size-full object-cover transition duration-200 group-hover:scale-105"
                          draggable="false"
                        />
                      ) : (
                        <span className="grid size-full place-items-center text-amber-100">
                          <UserRound className="size-9" />
                        </span>
                      )}
                      <span
                        className={cn(
                          'absolute inset-x-2 bottom-2 h-1 rounded-full',
                          character.markerClass,
                        )}
                      />
                    </span>

                    <span className="flex min-w-0 flex-col justify-between p-3">
                      <span>
                        <strong className="block truncate text-base font-black text-stone-100">
                          {title}
                        </strong>
                        <small className="mt-1 line-clamp-2 block text-xs font-semibold leading-5 text-stone-400">
                          {subtitle}
                        </small>
                      </span>
                      <span className="mt-3 inline-flex w-fit items-center gap-2 rounded-full border border-amber-200/20 bg-amber-950/25 px-3 py-1 text-[0.65rem] font-black uppercase text-amber-100">
                        <Check className="size-3.5" />
                        {t('game.enterWithMercenary')}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="rounded-lg border border-red-200/15 bg-red-950/20 px-4 py-5 text-sm font-semibold text-red-100">
              {error || t('game.noMercenariesAvailable')}
            </div>
          )}

          {error ? (
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                variant="outline"
                className="h-10 cursor-pointer border-red-200/20 bg-black/55 text-stone-100 hover:border-amber-300/45 hover:bg-red-950/55 hover:text-amber-100"
                onClick={onRetry}
              >
                {t('common.refresh')}
              </Button>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function Game() {
  const { lobbyId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const gamePreferencesRef = useRef(getGamePreferences());
  const translateRef = useRef(t);
  const actionTimerRef = useRef(null);
  const localPlayerIdsRef = useRef([]);
  const playerDeckCountRef = useRef(0);
  const powerCardCountRef = useRef(0);
  const pileElevationTimeoutRef = useRef(null);
  const pileRef = useRef([]);
  const lifeLossHighlightTimeoutRef = useRef(null);
  const queuedRoundEndMessagesRef = useRef([]);
  const roundCardCountRef = useRef(0);
  const profileCardRef = useRef(null);
  const roundEndDelayTimeoutRef = useRef(null);
  const roundEndDelayActiveRef = useRef(false);
  const turnPromptSoundRef = useRef('');
  const socketRef = useRef(null);
  const upcardRef = useRef(null);
  const [authGateError, setAuthGateError] = useState('');
  const [authGateOpen, setAuthGateOpen] = useState(() => !getAuthToken());
  const [actionTimer, setActionTimer] = useState(null);
  const [gamePreferences, setGamePreferencesState] = useState(
    () => gamePreferencesRef.current,
  );
  const [isProfileConfirming, setIsProfileConfirming] = useState(false);
  const [profileGateState, setProfileGateState] = useState({
    canSaveProfile: false,
    hasAuthToken: Boolean(getAuthToken()),
    isSaving: false,
    saveError: '',
  });
  const [joinAttempt, setJoinAttempt] = useState(0);
  const [currentPlayerId, setCurrentPlayerId] = useState(() => getCurrentPlayerId());
  const [lifes, setLifes] = useState(() =>
    getLobbyLifes(lobbyId, location.state?.lifes),
  );
  const [waitingLifeMultiplier, setWaitingLifeMultiplier] = useState(() =>
    getLobbyLifeMultiplier(lobbyId, location.state?.lifeMultiplier),
  );
  const [waitingPowerDeckId, setWaitingPowerDeckId] = useState(() =>
    getLobbyPowerDeckId(lobbyId, location.state?.powerDeckId),
  );
  const [waitingPowerDeckMeta, setWaitingPowerDeckMeta] = useState(null);
  const [gameType, setGameType] = useState(() =>
    getLobbyGameType(lobbyId, location.state?.gameType),
  );
  const [selectedMercenaryId, setSelectedMercenaryId] = useState(() =>
    getLobbyCharacterId(lobbyId, location.state?.characterId),
  );
  const [isMercenaryGateOpen, setIsMercenaryGateOpen] = useState(false);
  const [joinMercenaries, setJoinMercenaries] = useState([]);
  const [isMercenaryGateLoading, setIsMercenaryGateLoading] = useState(false);
  const [mercenaryGateError, setMercenaryGateError] = useState('');
  const [playersById, setPlayersById] = useState(() => {
    const playerId = getCurrentPlayerId();

    if (!playerId) {
      return {};
    }

    return {
      [playerId]: createFallbackPlayer(
        playerId,
        getLobbyLifes(lobbyId, location.state?.lifes),
      ),
    };
  });
  const playersByIdRef = useRef(playersById);
  const [joinError, setJoinError] = useState('');
  const [gameEndSummary, setGameEndSummary] = useState(null);
  const [lifeLossHighlight, setLifeLossHighlight] = useState(null);
  const [gameStage, setGameStage] = useState('waiting');
  const [hasGameSocket, setHasGameSocket] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isReadySending, setIsReadySending] = useState(false);
  const [matchPhase, setMatchPhase] = useState('waiting');
  const [elevatedPileCardKey, setElevatedPileCardKey] = useState('');
  const [pile, setPile] = useState([]);
  const [playerDeck, setPlayerDeck] = useState([]);
  const [powerCards, setPowerCards] = useState([]);
  const [draggingPowerCard, setDraggingPowerCard] = useState(null);
  const [playedCardAnimation, setPlayedCardAnimation] = useState(null);
  const [possibleBids, setPossibleBids] = useState([]);
  const [roundCardCount, setRoundCardCount] = useState(0);
  const [turnPlayerId, setTurnPlayerId] = useState(null);
  const [upcard, setUpcard] = useState(null);
  const returnToRoomsPath = location.state?.returnToRooms || '/rooms';

  const selectedCardBackSrc = useMemo(
    () => getCardBackSrc(gamePreferences.cardBack),
    [gamePreferences.cardBack],
  );

  const resolvedCurrentPlayerId = useMemo(() => {
    return resolveCurrentPlayerId(playersById, currentPlayerId);
  }, [currentPlayerId, playersById]);

  const tablePlayers = useMemo(() => {
    const players = Object.values(playersById);
    const visiblePlayers =
      matchPhase === 'waiting'
        ? players
        : players.filter((player) => hasPositiveLifes(player, lifes));

    return sortPlayers(visiblePlayers, resolvedCurrentPlayerId).slice(
      0,
      MAX_TABLE_PLAYERS,
    );
  }, [lifes, matchPhase, playersById, resolvedCurrentPlayerId]);

  const readyCount = tablePlayers.filter((player) => player.ready).length;
  const totalPlayers = tablePlayers.length;
  const currentPlayer = resolvedCurrentPlayerId
    ? playersById[resolvedCurrentPlayerId]
    : null;
  const localPlayerIds = useMemo(() => {
    return Array.from(
      new Set(
        [currentPlayerId, resolvedCurrentPlayerId, currentPlayer?.id].filter(Boolean),
      ),
    );
  }, [currentPlayerId, currentPlayer?.id, resolvedCurrentPlayerId]);

  localPlayerIdsRef.current = localPlayerIds;

  useEffect(() => {
    playersByIdRef.current = playersById;
  }, [playersById]);

  useEffect(() => {
    translateRef.current = t;
  }, [t]);

  useEffect(() => {
    setSelectedMercenaryId(getLobbyCharacterId(lobbyId, location.state?.characterId));
    setIsMercenaryGateOpen(false);
    setMercenaryGateError('');
  }, [lobbyId, location.state?.characterId]);

  const loadJoinMercenaries = useCallback(async () => {
    setIsMercenaryGateLoading(true);
    setMercenaryGateError('');

    try {
      const response = await getMercenaries();
      setJoinMercenaries(
        normalizeRemoteMercenaries(Array.isArray(response) ? response : []),
      );
    } catch (error) {
      setJoinMercenaries([]);

      if (isMissingAuthTokenError(error)) {
        setAuthGateOpen(true);
        return;
      }

      setMercenaryGateError(error.message || t('pages.characters.loadError'));
    } finally {
      setIsMercenaryGateLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (!isMercenaryGateOpen) {
      return;
    }

    void loadJoinMercenaries();
  }, [isMercenaryGateOpen, loadJoinMercenaries]);

  const handleJoinMercenarySelect = useCallback(
    (mercenaryId) => {
      if (!mercenaryId) {
        return;
      }

      if (lobbyId) {
        localStorage.setItem(`ohhell_lobby_character_${lobbyId}`, mercenaryId);
      }

      setSelectedMercenaryId(mercenaryId);
      setIsMercenaryGateOpen(false);
      setMercenaryGateError('');
      setJoinAttempt((attempt) => attempt + 1);
    },
    [lobbyId],
  );

  useEffect(() => {
    playerDeckCountRef.current = playerDeck.length;
  }, [playerDeck.length]);

  useEffect(() => {
    roundCardCountRef.current = roundCardCount;
  }, [roundCardCount]);

  useEffect(() => {
    if (gameType !== gameTypes.FODINHA_POWER) {
      stopHellHandHomeTheme();
      return undefined;
    }

    startHellHandHomeTheme();
    return () => stopHellHandHomeTheme();
  }, [gameType]);

  useEffect(() => {
    if (
      gameType !== gameTypes.FODINHA_POWER ||
      !waitingPowerDeckId ||
      matchPhase !== 'waiting'
    ) {
      setWaitingPowerDeckMeta(null);
      return undefined;
    }

    let isActive = true;

    const loadPowerDeckMeta = async () => {
      try {
        const decks = await getPowerDecks();

        if (!isActive) {
          return;
        }

        const deck = (Array.isArray(decks) ? decks : []).find(
          (candidate) => candidate.id === waitingPowerDeckId,
        );

        setWaitingPowerDeckMeta(
          deck
            ? {
                cardCount: deck.card_count,
                kind: deck.kind,
                name: deck.name,
              }
            : null,
        );
      } catch {
        if (isActive) {
          setWaitingPowerDeckMeta(null);
        }
      }
    };

    void loadPowerDeckMeta();

    return () => {
      isActive = false;
    };
  }, [gameType, matchPhase, waitingPowerDeckId]);

  const playedCountsByPlayer = useMemo(
    () => getPlayedCountsByPlayer(pile),
    [pile],
  );
  const isWaitingForReady = matchPhase === 'waiting';
  const isCurrentPlayerTurn = Boolean(
    currentPlayer?.turnToPlay ||
      (turnPlayerId && localPlayerIds.includes(turnPlayerId)),
  );
  const isCurrentPowerTurn = Boolean(
    gameType === gameTypes.FODINHA_POWER &&
      gameStage === 'power' &&
      hasGameSocket &&
      isCurrentPlayerTurn,
  );
  const canPlayCards = Boolean(
    gameStage === 'dealing' &&
      hasGameSocket &&
      isCurrentPlayerTurn &&
      playerDeck.length,
  );
  const canUsePowerCards = Boolean(
    isCurrentPowerTurn &&
      powerCards.length,
  );
  const canSkipPowerPhase = isCurrentPowerTurn;
  const hasEnoughPlayers = totalPlayers > 1;
  const needsMercenarySelection = Boolean(
    gameType === gameTypes.FODINHA_POWER &&
      !currentPlayer?.mercenaryId &&
      !selectedMercenaryId,
  );
  const canToggleReady = Boolean(
    hasGameSocket &&
      isWaitingForReady &&
      hasEnoughPlayers &&
      !needsMercenarySelection &&
      !isReadySending,
  );

  const playConfiguredSound = (soundSrc) => {
    playGameSound(soundSrc, gamePreferencesRef.current.volume);
  };

  const clearTurnPromptSound = () => {
    turnPromptSoundRef.current = '';
  };

  const playTurnPromptSound = (type, playerId) => {
    const soundKey = `${type}:${playerId}`;

    if (turnPromptSoundRef.current === soundKey) {
      return;
    }

    turnPromptSoundRef.current = soundKey;
    playConfiguredSound(type === 'bid' ? bidTurnSound : playerTurnSound);
  };

  const clearActionTimer = useCallback(() => {
    actionTimerRef.current = null;
    setActionTimer(null);
  }, []);

  const clearLifeLossHighlight = useCallback(() => {
    if (lifeLossHighlightTimeoutRef.current) {
      window.clearTimeout(lifeLossHighlightTimeoutRef.current);
    }

    lifeLossHighlightTimeoutRef.current = null;
    setLifeLossHighlight(null);
  }, []);

  const showLifeLossHighlight = useCallback((lifesByPlayer, defaultLifes) => {
    const highlight = createLifeLossHighlight(
      lifesByPlayer,
      playersByIdRef.current,
      defaultLifes,
    );

    if (!highlight) {
      return;
    }

    if (lifeLossHighlightTimeoutRef.current) {
      window.clearTimeout(lifeLossHighlightTimeoutRef.current);
    }

    setLifeLossHighlight(highlight);
    lifeLossHighlightTimeoutRef.current = window.setTimeout(() => {
      lifeLossHighlightTimeoutRef.current = null;
      setLifeLossHighlight(null);
    }, LIFE_LOSS_HIGHLIGHT_DURATION_MS);
  }, []);

  const handleBackToMenu = useCallback(() => {
    navigate('/create-game');
  }, [navigate]);

  const startActionTimer = useCallback(
    (
      type,
      cardCount,
      actionGameType = gameTypes.FODINHA_CLASSIC,
      powerCardCount = 0,
    ) => {
      const normalizedCardCount = Math.max(
        0,
        Math.trunc(Number(cardCount) || 0),
      );
      const normalizedPowerCardCount =
        actionGameType === gameTypes.FODINHA_POWER
          ? Math.max(0, Math.trunc(Number(powerCardCount) || 0))
          : 0;
      const baseSeconds =
        actionGameType === gameTypes.FODINHA_POWER
          ? POWER_TURN_DELAY_BASE_SECONDS
          : CLASSIC_TURN_DELAY_BASE_SECONDS;
      const durationMs =
        (baseSeconds +
          normalizedCardCount * TURN_DELAY_CARD_SECONDS +
          normalizedPowerCardCount * TURN_DELAY_POWER_CARD_SECONDS) *
        1000;

      const nextTimer = {
        cardCount: normalizedCardCount,
        durationMs,
        id: `${type}-${Date.now()}`,
        powerCardCount: normalizedPowerCardCount,
        startedAt: Date.now(),
        type,
      };

      actionTimerRef.current = nextTimer;
      setActionTimer(nextTimer);
    },
    [],
  );

  const clearPileElevation = useCallback(() => {
    if (pileElevationTimeoutRef.current) {
      window.clearTimeout(pileElevationTimeoutRef.current);
    }

    pileElevationTimeoutRef.current = null;
    setElevatedPileCardKey('');
  }, []);

  const elevatePileCard = useCallback(
    (turn) => {
      clearPileElevation();

      const turnKey = getTurnKey(turn);
      setElevatedPileCardKey(turnKey);
      pileElevationTimeoutRef.current = window.setTimeout(() => {
        pileElevationTimeoutRef.current = null;
        setElevatedPileCardKey((currentKey) =>
          currentKey === turnKey ? '' : currentKey,
        );
      }, PILE_WEAK_CARD_DELAY_MS);
    },
    [clearPileElevation],
  );

  useEffect(() => {
    return subscribeToGamePreferences((preferences) => {
      gamePreferencesRef.current = preferences;
      setGamePreferencesState(preferences);
    });
  }, []);

  const handleProfileStateChange = useCallback((state) => {
    setProfileGateState((previousState) => {
      if (
        previousState.canSaveProfile === state.canSaveProfile &&
        previousState.hasAuthToken === state.hasAuthToken &&
        previousState.isSaving === state.isSaving &&
        previousState.saveError === state.saveError
      ) {
        return previousState;
      }

      return state;
    });
  }, []);

  const continueToLobby = async () => {
    if (isProfileConfirming) {
      return;
    }

    setIsProfileConfirming(true);
    setAuthGateError('');

    try {
      const savedProfile = await profileCardRef.current?.saveIfNeeded?.();
      const token = savedProfile?.token || getAuthToken();

      if (!token) {
        setAuthGateError(t('game.authSaveGuest'));
        return;
      }

      const nextCurrentPlayerId = getCurrentPlayerId();

      setAuthGateOpen(false);
      setCurrentPlayerId(nextCurrentPlayerId);
      setPlayersById((previousPlayers) => {
        if (!nextCurrentPlayerId || previousPlayers[nextCurrentPlayerId]) {
          return previousPlayers;
        }

        return {
          ...previousPlayers,
          [nextCurrentPlayerId]: createFallbackPlayer(nextCurrentPlayerId, lifes),
        };
      });
      setJoinAttempt((attempt) => attempt + 1);
    } catch (error) {
      setAuthGateError(error.message || t('game.confirmProfileError'));
    } finally {
      setIsProfileConfirming(false);
    }
  };

  useEffect(() => {
    const nextLifes = getLobbyLifes(lobbyId, location.state?.lifes);
    const knownGameType = getKnownLobbyGameType(
      lobbyId,
      location.state?.gameType,
    );
    let activeGameType = knownGameType || gameTypes.FODINHA_CLASSIC;
    const nextLifeMultiplier = getLobbyLifeMultiplier(
      lobbyId,
      location.state?.lifeMultiplier,
    );
    const nextPowerDeckId = getLobbyPowerDeckId(
      lobbyId,
      location.state?.powerDeckId,
    );
    let activeCharacterId = selectedMercenaryId;
    const nextCurrentPlayerId = getCurrentPlayerId();
    const token = getAuthToken();

    setLifes(nextLifes);
    setGameType(activeGameType);
    setWaitingLifeMultiplier(nextLifeMultiplier);
    setWaitingPowerDeckId(nextPowerDeckId);
    if (lobbyId) {
      if (knownGameType) {
        localStorage.setItem(`ohhell_lobby_game_type_${lobbyId}`, activeGameType);
      }
      localStorage.setItem(
        `ohhell_lobby_power_life_multiplier_${lobbyId}`,
        String(nextLifeMultiplier),
      );
      if (nextPowerDeckId) {
        localStorage.setItem(`ohhell_lobby_power_deck_${lobbyId}`, nextPowerDeckId);
      }
      if (activeCharacterId) {
        localStorage.setItem(
          `ohhell_lobby_character_${lobbyId}`,
          activeCharacterId,
        );
      }
    }
    setCurrentPlayerId(nextCurrentPlayerId);
    setGameStage('waiting');
    setJoinError('');
    setGameEndSummary(null);
    clearLifeLossHighlight();
    setHasGameSocket(false);
    setIsReconnecting(false);
    setIsReadySending(false);
    setMatchPhase('waiting');
    clearActionTimer();
    clearPileElevation();
    playerDeckCountRef.current = 0;
    pileRef.current = [];
    powerCardCountRef.current = 0;
    roundCardCountRef.current = 0;
    setPile([]);
    setPlayerDeck([]);
    setPowerCards([]);
    setDraggingPowerCard(null);
    setPlayedCardAnimation(null);
    setPossibleBids([]);
    setRoundCardCount(0);
    setTurnPlayerId(null);
    upcardRef.current = null;
    setUpcard(null);

    if (!lobbyId) {
      return undefined;
    }

    if (!token) {
      setAuthGateOpen(true);
      setPlayersById({});
      return undefined;
    }

    setAuthGateOpen(false);
    setAuthGateError('');

    let isCurrent = true;
    let socket = null;
    let reconnectAttempt = 0;
    let reconnectTimeoutId = null;

    const clearReconnectTimeout = () => {
      if (reconnectTimeoutId !== null) {
        window.clearTimeout(reconnectTimeoutId);
      }

      reconnectTimeoutId = null;
    };

    const clearRoundEndDelay = () => {
      if (roundEndDelayTimeoutRef.current) {
        window.clearTimeout(roundEndDelayTimeoutRef.current);
      }

      queuedRoundEndMessagesRef.current = [];
      roundEndDelayTimeoutRef.current = null;
      roundEndDelayActiveRef.current = false;
    };

    clearRoundEndDelay();

    const updatePile = (nextPile) => {
      pileRef.current = nextPile;
      setPile(nextPile);
    };

    const updatePlayerDeck = (nextDeck) => {
      playerDeckCountRef.current = nextDeck.length;
      setPlayerDeck(nextDeck);
    };

    const updateRoundCardCount = (nextCount) => {
      const normalizedCount = Math.max(0, Number(nextCount) || 0);
      roundCardCountRef.current = normalizedCount;
      setRoundCardCount(normalizedCount);
    };

    const updateUpcard = (nextUpcard) => {
      upcardRef.current = nextUpcard;
      setUpcard(nextUpcard);
    };

    const getActionCardCount = (fallbackCount = 0) => {
      return Math.max(
        playerDeckCountRef.current,
        roundCardCountRef.current,
        Number(fallbackCount) || 0,
      );
    };

    const applyStatusMap = (statusMap, gameInfo) => {
      setPlayersById((previousPlayers) => {
        const normalizedPlayers = normalizeStatusMap(
          statusMap,
          nextLifes,
          previousPlayers,
        );

        return applyGameInfo(normalizedPlayers, gameInfo, nextLifes);
      });
    };

    const applyWaitingSettings = (waitingSettings) => {
      if (!waitingSettings) {
        return;
      }

      if (waitingSettings.game_type) {
        activeGameType = waitingSettings.game_type;
        setGameType(waitingSettings.game_type);
        if (lobbyId) {
          localStorage.setItem(
            `ohhell_lobby_game_type_${lobbyId}`,
            waitingSettings.game_type,
          );
        }
      }

      if (
        waitingSettings.game_type === gameTypes.FODINHA_POWER &&
        Number.isFinite(Number(waitingSettings.life_multiplier)) &&
        Number(waitingSettings.life_multiplier) > 0
      ) {
        const nextMultiplier = Number(waitingSettings.life_multiplier);

        setWaitingLifeMultiplier(nextMultiplier);
        if (lobbyId) {
          localStorage.setItem(
            `ohhell_lobby_power_life_multiplier_${lobbyId}`,
            String(nextMultiplier),
          );
        }
      }

      if (waitingSettings.power_deck_id) {
        setWaitingPowerDeckId(waitingSettings.power_deck_id);
        if (lobbyId) {
          localStorage.setItem(
            `ohhell_lobby_power_deck_${lobbyId}`,
            waitingSettings.power_deck_id,
          );
        }
      }
    };

    const getLocalPlayerIds = (gameInfo, statusMap) => {
      return getLocalPlayerIdCandidates({
        currentPlayerId: nextCurrentPlayerId,
        gameInfo,
        localPlayerIds: localPlayerIdsRef.current,
        playersById,
        statusMap,
      });
    };

    const isLocalPlayerId = (playerId, gameInfo, statusMap) => {
      return getLocalPlayerIds(gameInfo, statusMap).includes(playerId);
    };

    const applyGameState = (gameInfo, statusMap) => {
      if (!gameInfo) {
        return;
      }

      const localPlayerIds = getLocalPlayerIds(gameInfo, statusMap);
      const localPlayerId = localPlayerIds[0] || null;

      setIsReadySending(false);
      setMatchPhase('playing');
      updateUpcard(gameInfo.upcard || null);
      setTurnPlayerId(gameInfo.current_player || null);
      setGameStage(
        gameInfo.stage?.type === 'Bidding'
          ? 'bidding'
          : gameInfo.stage?.type === 'Power'
            ? 'power'
            : 'dealing',
      );

      if (localPlayerId) {
        setCurrentPlayerId(localPlayerId);
      }

      if (Array.isArray(gameInfo.deck)) {
        updatePlayerDeck(gameInfo.deck);
        updateRoundCardCount(gameInfo.deck.length);
      }

      const nextPowerCardCount = Array.isArray(gameInfo.power_cards)
        ? gameInfo.power_cards.length
        : powerCardCountRef.current;

      if (Array.isArray(gameInfo.power_cards)) {
        powerCardCountRef.current = nextPowerCardCount;
        setPowerCards(gameInfo.power_cards);
      }

      if (
        gameInfo.stage?.type === 'Bidding' &&
        localPlayerIds.includes(gameInfo.current_player)
      ) {
        setPossibleBids(gameInfo.stage.data?.possible_bids || []);
        startActionTimer(
          'bid',
          getActionCardCount(
            Math.max(...(gameInfo.stage.data?.possible_bids || [0])),
          ),
          activeGameType,
          nextPowerCardCount,
        );
        playTurnPromptSound('bid', gameInfo.current_player);
      } else if (
        gameInfo.stage?.type === 'Power' &&
        localPlayerIds.includes(gameInfo.current_player)
      ) {
        startActionTimer(
          'power',
          0,
          activeGameType,
          nextPowerCardCount,
        );
        playTurnPromptSound('bid', gameInfo.current_player);
      } else if (
        gameInfo.stage?.type === 'Dealing' &&
        localPlayerIds.includes(gameInfo.current_player)
      ) {
        startActionTimer(
          'play',
          getActionCardCount(),
          activeGameType,
          nextPowerCardCount,
        );
        playTurnPromptSound('play', gameInfo.current_player);
      } else {
        clearActionTimer();
        setPossibleBids([]);
      }
    };

    const completeRoundEndDelay = () => {
      if (!isCurrent) {
        return;
      }

      roundEndDelayTimeoutRef.current = null;
      roundEndDelayActiveRef.current = false;
      clearPileElevation();
      updatePile([]);
      setRoundCardCount((currentCount) => {
        const nextCount = Math.max(0, currentCount - 1);
        roundCardCountRef.current = nextCount;
        return nextCount;
      });

      const queuedMessages = queuedRoundEndMessagesRef.current;
      queuedRoundEndMessagesRef.current = [];

      for (let index = 0; index < queuedMessages.length; index += 1) {
        if (roundEndDelayActiveRef.current) {
          queuedRoundEndMessagesRef.current = queuedMessages.slice(index);
          break;
        }

        processServerMessage(queuedMessages[index]);
      }
    };

    const startRoundEndDelay = () => {
      if (roundEndDelayTimeoutRef.current) {
        window.clearTimeout(roundEndDelayTimeoutRef.current);
      }

      const delayMs = pileElevationTimeoutRef.current
        ? PILE_WEAK_CARD_DELAY_MS + ROUND_END_DELAY_MS
        : ROUND_END_DELAY_MS;

      roundEndDelayActiveRef.current = true;
      roundEndDelayTimeoutRef.current = window.setTimeout(
        completeRoundEndDelay,
        delayMs,
      );
    };

    function processServerMessage(message) {
      switch (message.type) {
        case 'Snapshot': {
          if (message.data?.type === 'Waiting') {
            setGameStage('waiting');
            setMatchPhase('waiting');
            clearPileElevation();
            updatePile([]);
            updatePlayerDeck([]);
            powerCardCountRef.current = 0;
            setPowerCards([]);
            setDraggingPowerCard(null);
            setPlayedCardAnimation(null);
            setGameEndSummary(null);
            clearLifeLossHighlight();
            setPossibleBids([]);
            updateRoundCardCount(0);
            setTurnPlayerId(null);
            updateUpcard(null);
          }

          const statusMap = getSnapshotStatusMap(message.data);
          const gameInfo = getGameInfoFromSnapshot(message.data);

          if (statusMap) {
            applyWaitingSettings(getWaitingLobbySettings(message.data));
            applyStatusMap(statusMap, gameInfo);
          }
          if (gameInfo) {
            applyGameState(gameInfo, statusMap);
          }
          break;
        }
        case 'PlayerJoined': {
          setPlayersById((previousPlayers) => {
            const player = normalizePlayer({
              fallbackId: getClaimsPlayerId(message.data),
              lifes: nextLifes,
              player: message.data,
              ready: false,
            });
            const existing = previousPlayers[player.id];

            return {
              ...previousPlayers,
              [player.id]: {
                ...existing,
                ...player,
                ready: existing?.ready ?? player.ready,
              },
            };
          });
          break;
        }
        case 'PlayerLeft':
          setPlayersById((previousPlayers) => {
            const nextPlayers = { ...previousPlayers };
            delete nextPlayers[message.data.player_id];

            return nextPlayers;
          });
          break;
        case 'PlayerStatusChange':
          setIsReadySending(false);

          setPlayersById((previousPlayers) => {
            const playerId = message.data.player_id;
            const existing =
              previousPlayers[playerId] || createFallbackPlayer(playerId, nextLifes);

            return {
              ...previousPlayers,
              [playerId]: {
                ...existing,
                ready: message.data.ready,
              },
            };
          });
          break;
        case 'PlayerMercenarySelected':
          setPlayersById((previousPlayers) => {
            const playerId = message.data.player_id;
            const existing =
              previousPlayers[playerId] || createFallbackPlayer(playerId, nextLifes);

            return {
              ...previousPlayers,
              [playerId]: {
                ...existing,
                mercenaryId: message.data.mercenary_id,
              },
            };
          });
          break;
        case 'PlayerBidded':
          clearTurnPromptSound();
          clearActionTimer();
          setGameStage('bidding');
          setMatchPhase('playing');
          setPossibleBids([]);
          setPlayersById((previousPlayers) => {
            const playerId = message.data.player_id;
            const existing =
              previousPlayers[playerId] || createFallbackPlayer(playerId, nextLifes);

            return {
              ...previousPlayers,
              [playerId]: {
                ...existing,
                bid: message.data.bid,
                points: 0,
                turnToPlay: false,
              },
            };
          });
          break;
        case 'PlayersManaChanged':
          setPlayersById((previousPlayers) => {
            const nextPlayers = { ...previousPlayers };

            Object.entries(message.data || {}).forEach(([playerId, mana]) => {
              const existing =
                nextPlayers[playerId] || createFallbackPlayer(playerId, nextLifes);

              nextPlayers[playerId] = {
                ...existing,
                mana,
              };
            });

            playersByIdRef.current = nextPlayers;
            return nextPlayers;
          });
          break;
        case 'PlayersLifesChanged':
          showLifeLossHighlight(message.data || {}, nextLifes);
          setPlayersById((previousPlayers) => {
            const nextPlayers = { ...previousPlayers };

            Object.entries(message.data || {}).forEach(([playerId, life]) => {
              const existing =
                nextPlayers[playerId] || createFallbackPlayer(playerId, nextLifes);

              nextPlayers[playerId] = {
                ...existing,
                lifes: life,
              };
            });

            playersByIdRef.current = nextPlayers;
            return nextPlayers;
          });
          break;
        case 'RoundEnded':
          clearTurnPromptSound();
          clearActionTimer();
          setGameStage('dealing');
          setMatchPhase('playing');
          setPossibleBids([]);
          setTurnPlayerId(null);
          setPlayersById((previousPlayers) => {
            const nextPlayers = { ...previousPlayers };

            Object.entries(message.data || {}).forEach(([playerId, points]) => {
              const existing =
                nextPlayers[playerId] || createFallbackPlayer(playerId, nextLifes);

              nextPlayers[playerId] = {
                ...existing,
                points,
              };
            });

            return nextPlayers;
          });
          startRoundEndDelay();
          break;
        case 'PlayerBiddingTurn':
          setIsReadySending(false);
          setGameStage('bidding');
          setMatchPhase('playing');
          setTurnPlayerId(message.data.player_id);
          if (isLocalPlayerId(message.data.player_id)) {
            setPossibleBids(message.data.possible_bids || []);
            startActionTimer(
              'bid',
              getActionCardCount(Math.max(...(message.data.possible_bids || [0]))),
              activeGameType,
              powerCardCountRef.current,
            );
            playTurnPromptSound('bid', message.data.player_id);
          } else {
            clearActionTimer();
            setPossibleBids([]);
          }
          setPlayersById((previousPlayers) => {
            return Object.entries(previousPlayers).reduce(
              (nextPlayers, [playerId, player]) => {
                nextPlayers[playerId] = {
                  ...player,
                  turnToPlay: playerId === message.data.player_id,
                };

                return nextPlayers;
              },
              {},
            );
          });
          break;
        case 'PlayerPowerTurn':
          setIsReadySending(false);
          setGameStage('power');
          setMatchPhase('playing');
          setPossibleBids([]);
          setTurnPlayerId(message.data.player_id);
          if (isLocalPlayerId(message.data.player_id)) {
            startActionTimer(
              'power',
              0,
              activeGameType,
              powerCardCountRef.current,
            );
            playTurnPromptSound('bid', message.data.player_id);
          } else {
            clearActionTimer();
          }
          setPlayersById((previousPlayers) => {
            return Object.entries(previousPlayers).reduce(
              (nextPlayers, [playerId, player]) => {
                nextPlayers[playerId] = {
                  ...player,
                  turnToPlay: playerId === message.data.player_id,
                };

                return nextPlayers;
              },
              {},
            );
          });
          break;
        case 'PlayerDeck':
          setIsReadySending(false);
          setMatchPhase('playing');
          updatePlayerDeck(message.data || []);
          updateRoundCardCount((message.data || []).length);
          startActionTimer(
            'cards',
            (message.data || []).length,
            activeGameType,
            powerCardCountRef.current,
          );
          break;
        case 'PlayerPowerCards':
          setIsReadySending(false);
          setMatchPhase('playing');
          powerCardCountRef.current = (message.data || []).length;
          setPowerCards(message.data || []);
          if (actionTimerRef.current?.type === 'cards') {
            startActionTimer(
              'cards',
              getActionCardCount(),
              activeGameType,
              powerCardCountRef.current,
            );
          }
          break;
        case 'PowerCardPlayed': {
          clearTurnPromptSound();
          clearActionTimer();
          const effectLifes = message.data?.lifes || {};

          if (isLocalPlayerId(message.data?.player_id)) {
            setPowerCards((currentCards) => {
              const nextCards = removePowerCardFromHand(
                currentCards,
                message.data.card?.id,
              );
              powerCardCountRef.current = nextCards.length;
              return nextCards;
            });
          }

          showLifeLossHighlight(effectLifes, nextLifes);
          setPlayersById((previousPlayers) => {
            const nextPlayers = { ...previousPlayers };

            Object.entries(effectLifes).forEach(([playerId, life]) => {
              const existing =
                nextPlayers[playerId] || createFallbackPlayer(playerId, nextLifes);

              nextPlayers[playerId] = {
                ...existing,
                lifes: life,
              };
            });

            playersByIdRef.current = nextPlayers;
            return nextPlayers;
          });
          break;
        }
        case 'PlayerTurn':
          setIsReadySending(false);
          setGameStage('dealing');
          setMatchPhase('playing');
          setPossibleBids([]);
          setTurnPlayerId(message.data.player_id);
          if (isLocalPlayerId(message.data.player_id)) {
            startActionTimer(
              'play',
              getActionCardCount(),
              activeGameType,
              powerCardCountRef.current,
            );
            playTurnPromptSound('play', message.data.player_id);
          } else {
            clearActionTimer();
          }
          setPlayersById((previousPlayers) => {
            return Object.entries(previousPlayers).reduce(
              (nextPlayers, [playerId, player]) => {
                nextPlayers[playerId] = {
                  ...player,
                  turnToPlay: playerId === message.data.player_id,
                };

                return nextPlayers;
              },
              {},
            );
          });
          break;
        case 'TurnPlayed':
          clearTurnPromptSound();
          clearActionTimer();
          setIsReadySending(false);
          setGameStage('dealing');
          setMatchPhase('playing');
          setPossibleBids([]);
          {
            const previousPile = pileRef.current;
            const nextPile = message.data?.pile || [];
            const addedTurn = getAddedTurn(previousPile, nextPile);
            const currentUpcard = upcardRef.current;
            const strongestPreviousTurn = getStrongestTurn(
              previousPile,
              currentUpcard,
            );

            updatePile(nextPile);

            if (
              addedTurn &&
              strongestPreviousTurn &&
              getCardStrength(addedTurn.card, currentUpcard) <=
                getCardStrength(strongestPreviousTurn.card, currentUpcard)
            ) {
              elevatePileCard(addedTurn);
            } else {
              clearPileElevation();
            }
          }
          setPlayersById((previousPlayers) => {
            return Object.entries(previousPlayers).reduce(
              (nextPlayers, [playerId, player]) => {
                nextPlayers[playerId] = {
                  ...player,
                  turnToPlay: false,
                };

                return nextPlayers;
              },
              {},
            );
          });

          (message.data?.pile || []).forEach((turn) => {
            if (isLocalPlayerId(turn.player_id)) {
              setPlayerDeck((currentDeck) => {
                const nextDeck = removeCardFromDeck(currentDeck, turn.card);
                playerDeckCountRef.current = nextDeck.length;
                return nextDeck;
              });
            }
          });
          break;
        case 'SetStart':
          clearTurnPromptSound();
          clearActionTimer();
          setIsReadySending(false);
          setGameStage('bidding');
          setMatchPhase('playing');
          setGameEndSummary(null);
          clearPileElevation();
          updatePile([]);
          updatePlayerDeck([]);
          powerCardCountRef.current = 0;
          setPowerCards([]);
          setDraggingPowerCard(null);
          setPlayedCardAnimation(null);
          setPossibleBids([]);
          updateRoundCardCount(0);
          setTurnPlayerId(null);
          updateUpcard(message.data.upcard);
          setPlayersById((previousPlayers) => {
            return Object.entries(previousPlayers).reduce(
              (nextPlayers, [playerId, player]) => {
                nextPlayers[playerId] = {
                  ...player,
                  bid: null,
                  points: 0,
                  turnToPlay: false,
                };

                return nextPlayers;
              },
              {},
            );
          });
          break;
        case 'SetEnded':
          clearTurnPromptSound();
          clearActionTimer();
          setGameStage('dealing');
          setMatchPhase('playing');
          clearPileElevation();
          updatePile([]);
          setPossibleBids([]);
          updateRoundCardCount(0);
          showLifeLossHighlight(message.data?.lifes || {}, nextLifes);
          setPlayersById((previousPlayers) => {
            const nextPlayers = { ...previousPlayers };

            Object.entries(message.data?.lifes || {}).forEach(([playerId, life]) => {
              const existing =
                nextPlayers[playerId] || createFallbackPlayer(playerId, nextLifes);

              nextPlayers[playerId] = {
                ...existing,
                lifes: life,
                points: 0,
              };
            });

            playersByIdRef.current = nextPlayers;
            return nextPlayers;
          });
          break;
        case 'GameEnded':
          clearTurnPromptSound();
          clearActionTimer();
          setIsReadySending(false);
          setGameStage('ended');
          setMatchPhase('ended');
          clearPileElevation();
          updatePile([]);
          updatePlayerDeck([]);
          powerCardCountRef.current = 0;
          setPowerCards([]);
          setDraggingPowerCard(null);
          setPlayedCardAnimation(null);
          setPossibleBids([]);
          updateRoundCardCount(0);
          setTurnPlayerId(null);
          updateUpcard(null);
          clearLifeLossHighlight();
          {
            const finalLifes = message.data?.lifes || {};
            const nextPlayers = mergeLifesIntoPlayers(
              playersByIdRef.current,
              finalLifes,
              nextLifes,
              { points: 0, ready: false, turnToPlay: false },
            );

            playersByIdRef.current = nextPlayers;
            setPlayersById(nextPlayers);
            setGameEndSummary(
              createGameEndSummary(finalLifes, nextPlayers, nextLifes),
            );
          }
          break;
        case 'Error':
          setIsReadySending(false);
          setJoinError(message.data.msg || 'Erro na conexao da sala.');
          showToast({
            message: message.data.msg || 'Erro na conexao da sala.',
            variant: 'error',
          });
          break;
        default:
          break;
      }
    }

    const handleServerMessage = (message) => {
      if (!isCurrent) {
        return;
      }

      if (roundEndDelayActiveRef.current && message.type !== 'Error') {
        queuedRoundEndMessagesRef.current = [
          ...queuedRoundEndMessagesRef.current,
          message,
        ];
        return;
      }

      if (
        (message.type === 'SetEnded' || message.type === 'GameEnded') &&
        pileRef.current.length > 0
      ) {
        clearTurnPromptSound();
        clearActionTimer();
        setIsReadySending(false);
        setPossibleBids([]);
        setTurnPlayerId(null);
        queuedRoundEndMessagesRef.current = [
          ...queuedRoundEndMessagesRef.current,
          message,
        ];
        startRoundEndDelay();
        return;
      }

      processServerMessage(message);
    };

    function scheduleReconnect() {
      if (!isCurrent) {
        return;
      }

      clearReconnectTimeout();
      setHasGameSocket(false);
      setIsReconnecting(true);
      setIsReadySending(false);
      clearActionTimer();
      setJoinError('');

      const delayMs = WS_RECONNECT_DELAYS_MS[
        Math.min(reconnectAttempt, WS_RECONNECT_DELAYS_MS.length - 1)
      ];
      reconnectAttempt += 1;

      reconnectTimeoutId = window.setTimeout(() => {
        reconnectTimeoutId = null;
        void connectSocket();
      }, delayMs);
    }

    async function connectSocket() {
      if (!isCurrent) {
        return;
      }

      let latestToken;

      try {
        latestToken = await refreshAuthIfNeeded();
      } catch {
        if (isCurrent) {
          setIsReconnecting(false);
          setAuthGateOpen(true);
          setAuthGateError(translateRef.current('game.missingAuth'));
        }

        return;
      }

      if (!isCurrent) {
        return;
      }

      if (!latestToken) {
        setIsReconnecting(false);
        setAuthGateOpen(true);
        setAuthGateError(translateRef.current('game.missingAuth'));
        return;
      }

      let nextSocket = null;

      try {
        nextSocket = createGameSocket({
          onClose: (event) => {
            if (!isCurrent || socketRef.current !== nextSocket) {
              return;
            }

            socketRef.current = null;
            socket = null;
            setHasGameSocket(false);
            setIsReadySending(false);
            clearActionTimer();

            if (isWaitingLobbyInactiveClose(event)) {
              isCurrent = false;
              clearReconnectTimeout();
              setIsReconnecting(false);
              showToast({
                message: translateRef.current('pages.rooms.roomInactiveToast'),
                variant: 'warning',
              });
              navigate(returnToRoomsPath, { replace: true });
              return;
            }

            scheduleReconnect();
          },
          onError: () => {
            if (!isCurrent || socketRef.current !== nextSocket) {
              return;
            }

            setHasGameSocket(false);
            setIsReadySending(false);
          },
          onMessage: (message) => {
            if (socketRef.current === nextSocket) {
              handleServerMessage(message);
            }
          },
          onOpen: () => {
            if (!isCurrent || socketRef.current !== nextSocket) {
              return;
            }

            reconnectAttempt = 0;
            clearReconnectTimeout();
            setHasGameSocket(true);
            setIsReconnecting(false);
            setJoinError('');

            if (activeGameType === gameTypes.FODINHA_POWER && activeCharacterId) {
              try {
                selectMercenary(nextSocket, activeCharacterId);
              } catch {}
            }
          },
          token: latestToken,
        });
      } catch {
        scheduleReconnect();
        return;
      }

      socket = nextSocket;
      socketRef.current = nextSocket;
    }

    const resolveJoinGameType = async () => {
      if (knownGameType) {
        return knownGameType;
      }

      try {
        const lobbies = await getLobbies();
        const summaryGameType = getLobbySummaryGameType(lobbyId, lobbies);

        if (summaryGameType) {
          localStorage.setItem(
            `ohhell_lobby_game_type_${lobbyId}`,
            summaryGameType,
          );
          return summaryGameType;
        }
      } catch (error) {
        if (!isCurrent) {
          return '';
        }

        if (isMissingAuthTokenError(error) || !getAuthToken()) {
          setAuthGateOpen(true);
          setAuthGateError(translateRef.current('game.missingAuth'));
          setJoinError('');
        } else {
          setJoinError(error.message || translateRef.current('game.enterRoomError'));
        }

        return '';
      }

      return activeGameType;
    };

    const enterLobby = async () => {
      const resolvedGameType = await resolveJoinGameType();

      if (!isCurrent || !resolvedGameType) {
        return;
      }

      activeGameType = resolvedGameType;
      setGameType(resolvedGameType);

      if (lobbyId) {
        localStorage.setItem(`ohhell_lobby_game_type_${lobbyId}`, resolvedGameType);
      }

      if (resolvedGameType === gameTypes.FODINHA_POWER && !activeCharacterId) {
        setIsMercenaryGateOpen(true);
        setHasGameSocket(false);
        setIsReconnecting(false);
        return;
      }

      setIsMercenaryGateOpen(false);

      try {
        const lobbyInfo = await joinLobby(lobbyId);

        if (!isCurrent) {
          return;
        }

        const latestCurrentPlayerId = getCurrentPlayerId();
        const statusMap = getLobbyStatusMap(lobbyInfo);
        const gameInfo = getLobbyGameInfo(lobbyInfo);

        if (latestCurrentPlayerId) {
          setCurrentPlayerId(latestCurrentPlayerId);
        }

        if (statusMap) {
          setMatchPhase('waiting');
          applyWaitingSettings(getWaitingLobbySettings(lobbyInfo));
          applyStatusMap(statusMap);
        }

        if (gameInfo) {
          applyGameState(gameInfo, statusMap);
          setPlayersById((previousPlayers) =>
            applyGameInfo(previousPlayers, gameInfo, nextLifes),
          );
        }

        void connectSocket();
      } catch (error) {
        if (isCurrent) {
          if (isMissingAuthTokenError(error) || !getAuthToken()) {
            setAuthGateOpen(true);
            setAuthGateError(translateRef.current('game.missingAuth'));
            setJoinError('');
          } else {
            setJoinError(
              error.message || translateRef.current('game.enterRoomError'),
            );
          }
        }
      }
    };

    void enterLobby();

    return () => {
      isCurrent = false;
      clearReconnectTimeout();
      clearRoundEndDelay();
      clearLifeLossHighlight();
      if (pileElevationTimeoutRef.current) {
        window.clearTimeout(pileElevationTimeoutRef.current);
        pileElevationTimeoutRef.current = null;
      }
      setHasGameSocket(false);
      setIsReadySending(false);

      if (socket) {
        socket.close();
      }

      if (socketRef.current === socket) {
        socketRef.current = null;
      }

      setIsReconnecting(false);
    };
  }, [
    clearActionTimer,
    clearLifeLossHighlight,
    clearPileElevation,
    elevatePileCard,
    joinAttempt,
    lobbyId,
    location.state?.lifes,
    location.state?.gameType,
    location.state?.returnToRooms,
    navigate,
    selectedMercenaryId,
    showToast,
    showLifeLossHighlight,
    startActionTimer,
  ]);

  const toggleReady = () => {
    if (!canToggleReady || !socketRef.current) {
      return;
    }

    const nextReady = !currentPlayer?.ready;

    try {
      setIsReadySending(true);
      setPlayerReady(socketRef.current, nextReady);
    } catch (error) {
      setIsReadySending(false);
      setJoinError(error.message || t('game.readyError'));
    }
  };

  const sendBid = (bid) => {
    if (!socketRef.current || !possibleBids.includes(bid)) {
      return;
    }

    setPossibleBids([]);
    clearTurnPromptSound();
    clearActionTimer();
    setPlayersById((previousPlayers) => {
      if (!resolvedCurrentPlayerId || !previousPlayers[resolvedCurrentPlayerId]) {
        return previousPlayers;
      }

      return {
        ...previousPlayers,
        [resolvedCurrentPlayerId]: {
          ...previousPlayers[resolvedCurrentPlayerId],
          turnToPlay: false,
        },
      };
    });

    try {
      putBid(socketRef.current, bid);
    } catch (error) {
      setJoinError(error.message || t('game.bidError'));
    }
  };

  const handlePlayCard = (card) => {
    if (!socketRef.current) {
      setJoinError(t('game.connectionNotReady'));
      return;
    }

    if (gameStage !== 'dealing') {
      setJoinError(t('game.waitDeal'));
      return;
    }

    if (!isCurrentPlayerTurn) {
      setJoinError(t('game.waitTurn'));
      return;
    }

    try {
      setJoinError('');
      clearTurnPromptSound();
      clearActionTimer();
      playConfiguredSound(cardAnimationSound);
      setPlayedCardAnimation({
        card,
        id: `${Date.now()}-${getCardKey(card)}`,
      });
      playTurn(socketRef.current, card);
      setPlayerDeck((currentDeck) => {
        const nextDeck = removeCardFromDeck(currentDeck, card);
        playerDeckCountRef.current = nextDeck.length;
        return nextDeck;
      });
      setPlayersById((previousPlayers) => {
        if (!resolvedCurrentPlayerId || !previousPlayers[resolvedCurrentPlayerId]) {
          return previousPlayers;
        }

        return {
          ...previousPlayers,
          [resolvedCurrentPlayerId]: {
            ...previousPlayers[resolvedCurrentPlayerId],
            turnToPlay: false,
          },
        };
      });
    } catch (error) {
      setJoinError(error.message || t('game.playCardError'));
    }
  };

  const handleUsePowerCard = (card, targetPlayerId = null) => {
    if (!socketRef.current) {
      setJoinError(t('game.connectionNotReady'));
      return;
    }

    if (gameStage !== 'power') {
      setJoinError(t('game.waitPower'));
      return;
    }

    if (!isCurrentPowerTurn) {
      setJoinError(t('game.waitTurn'));
      return;
    }

    if (card?.state && card.state.ready === false) {
      return;
    }

    if (card.type === 'targetable' && !targetPlayerId) {
      setJoinError(t('game.powerCardTargetError'));
      return;
    }

    try {
      setJoinError('');
      clearTurnPromptSound();
      clearActionTimer();
      usePowerCard(socketRef.current, card.id, targetPlayerId);
      setDraggingPowerCard(null);
      setPlayersById((previousPlayers) => {
        if (!resolvedCurrentPlayerId || !previousPlayers[resolvedCurrentPlayerId]) {
          return previousPlayers;
        }

        return {
          ...previousPlayers,
          [resolvedCurrentPlayerId]: {
            ...previousPlayers[resolvedCurrentPlayerId],
            turnToPlay: false,
          },
        };
      });
    } catch (error) {
      setJoinError(error.message || t('game.powerCardUseError'));
    }
  };

  const handleSkipPowerPhase = () => {
    if (!socketRef.current) {
      setJoinError(t('game.connectionNotReady'));
      return;
    }

    if (!isCurrentPowerTurn) {
      setJoinError(t('game.waitTurn'));
      return;
    }

    try {
      setJoinError('');
      setDraggingPowerCard(null);
      clearTurnPromptSound();
      clearActionTimer();
      skipPowerPhase(socketRef.current);
      setPlayersById((previousPlayers) => {
        if (!resolvedCurrentPlayerId || !previousPlayers[resolvedCurrentPlayerId]) {
          return previousPlayers;
        }

        return {
          ...previousPlayers,
          [resolvedCurrentPlayerId]: {
            ...previousPlayers[resolvedCurrentPlayerId],
            turnToPlay: false,
          },
        };
      });
    } catch (error) {
      setJoinError(error.message || t('game.powerCardUseError'));
    }
  };

  const handlePowerCardDrop = (targetPlayerId) => {
    if (!draggingPowerCard) {
      return;
    }

    handleUsePowerCard(draggingPowerCard, targetPlayerId);
  };

  const handleActionTimerExpire = () => {
    const randomBid = getRandomItem(possibleBids);

    if (randomBid !== null) {
      sendBid(randomBid);
      return;
    }

    if (isCurrentPowerTurn) {
      handleSkipPowerPhase();
      return;
    }

    if (canPlayCards) {
      const randomCard = getRandomItem(playerDeck);

      if (randomCard) {
        handlePlayCard(randomCard);
        return;
      }
    }

    clearActionTimer();
  };

  return (
    <main
      aria-label={t('game.tableAria')}
      className="relative min-h-screen overflow-hidden bg-black"
    >
      <div
        className="absolute left-1/2 top-1/2 h-screen w-[130vh] -translate-x-1/2 -translate-y-1/2 rotate-90 scale-80 bg-cover bg-center bg-no-repeat sm:h-full sm:w-full sm:rotate-0 sm:scale-100"
        style={{ backgroundImage: `url(${tableBackground})` }}
      />

      <TableCenter
        cardBackSrc={selectedCardBackSrc}
        deckType={gamePreferences.deckType}
        elevatedPileCardKey={elevatedPileCardKey}
        pile={pile}
        playersById={playersById}
        upcard={upcard}
      />

      <ActionTimer onExpire={handleActionTimerExpire} timer={actionTimer} />

      {isWaitingForReady && gameType === gameTypes.FODINHA_POWER ? (
        <WaitingPowerLobbyInfo
          deckInfo={
            waitingPowerDeckMeta?.cardCount
              ? t('pages.createGame.powerDeckCardCount', {
                  count: waitingPowerDeckMeta.cardCount,
                })
              : ''
          }
          deckKind={waitingPowerDeckMeta?.kind}
          deckName={waitingPowerDeckMeta?.name || waitingPowerDeckId}
          lifeMultiplier={waitingLifeMultiplier}
        />
      ) : null}

      {isWaitingForReady && lobbyId ? <RoomLinkCopy lobbyId={lobbyId} /> : null}

      {tablePlayers.map((player, index) => {
        const isCurrentPlayer = player.id === resolvedCurrentPlayerId;
        const cardCount = getSeatCardCount({
          isCurrent: isCurrentPlayer,
          playerDeckLength: playerDeck.length,
          playerId: player.id,
          playedCountsByPlayer,
          roundCardCount,
        });

        return (
          <PlayerSeat
            key={player.id}
            avatarSrc={player.avatarSrc}
            cardBackSrc={selectedCardBackSrc}
            bid={player.bid}
            canDropPowerCard={
              canUsePowerCards &&
              draggingPowerCard?.type === 'targetable' &&
              Number(player.lifes ?? lifes) > 0
            }
            cardCount={cardCount}
            draggingPowerCard={draggingPowerCard}
            isCurrent={isCurrentPlayer}
            isReady={player.ready}
            isTurnToPlay={player.turnToPlay || player.id === turnPlayerId}
            lifes={player.lifes ?? lifes}
            mana={player.mana}
            nickname={player.nickname}
            onPowerCardDrop={() => handlePowerCardDrop(player.id)}
            position={getSeatPosition(
              index,
              tablePlayers.length,
              isCurrentPlayer,
            )}
            points={player.points}
            readyControls={
              isWaitingForReady && isCurrentPlayer ? (
                <ReadyControls
                  canToggleReady={canToggleReady}
                  hasEnoughPlayers={hasEnoughPlayers}
                  isPending={isReadySending}
                  isReady={player.ready}
                  needsMercenarySelection={needsMercenarySelection}
                  onToggleReady={toggleReady}
                  readyCount={readyCount}
                  totalPlayers={totalPlayers}
                />
              ) : null
            }
            showReadyState={isWaitingForReady}
            turnTimer={player.id === turnPlayerId ? actionTimer : null}
          />
        );
      })}

      <BidControls onBid={sendBid} possibleBids={hasGameSocket ? possibleBids : []} />
      <PowerCardHand
        canSkipPowerPhase={canSkipPowerPhase}
        canUsePowerCards={canUsePowerCards}
        cards={powerCards}
        onPowerCardDragEnd={() => setDraggingPowerCard(null)}
        onPowerCardDragStart={setDraggingPowerCard}
        onSkipPowerPhase={handleSkipPowerPhase}
        onUsePowerCard={handleUsePowerCard}
      />
      <PlayerHand
        canPlayCards={canPlayCards}
        cardBackSrc={selectedCardBackSrc}
        cards={playerDeck}
        deckType={gamePreferences.deckType}
        onPlayCard={handlePlayCard}
      />
      <PlayedCardAnimation
        key={playedCardAnimation?.id}
        card={playedCardAnimation?.card}
        cardBackSrc={selectedCardBackSrc}
        deckType={gamePreferences.deckType}
        onAnimationEnd={() => setPlayedCardAnimation(null)}
      />
      <LifeLossPopup highlight={lifeLossHighlight} />
      <GameEndedOverlay
        onBackToMenu={handleBackToMenu}
        summary={gameEndSummary}
      />

      {joinError ? (
        <div className="absolute left-1/2 top-6 z-20 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-destructive/50 bg-background/90 px-4 py-3 text-center text-sm text-destructive shadow-lg backdrop-blur">
          {joinError}
        </div>
      ) : null}

      {isReconnecting && !joinError ? (
        <div className="absolute left-1/2 top-6 z-20 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-amber-300/40 bg-black/85 px-4 py-3 text-center text-sm font-semibold text-amber-100 shadow-lg backdrop-blur">
          {t('game.reconnecting')}
        </div>
      ) : null}

      <HellHandMercenaryJoinGate
        characters={joinMercenaries}
        error={mercenaryGateError}
        isLoading={isMercenaryGateLoading}
        onRetry={() => {
          void loadJoinMercenaries();
        }}
        onSelect={handleJoinMercenarySelect}
        open={isMercenaryGateOpen && !authGateOpen}
      />

      <LobbyAuthGate
        canContinue={
          Boolean(lobbyId) && !isProfileConfirming && !profileGateState.isSaving
        }
        error={authGateError}
        gameType={gameType}
        isConfirming={isProfileConfirming}
        onContinue={continueToLobby}
        onProfileSaved={() => {
          setAuthGateError('');
        }}
        onProfileStateChange={handleProfileStateChange}
        open={authGateOpen}
        profileCardRef={profileCardRef}
      />
    </main>
  );
}
