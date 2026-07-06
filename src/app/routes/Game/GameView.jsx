import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, Link as LinkIcon, LogIn, Share2, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import heartIcon from '@/assets/icons/heart.png';
import bidTurnSound from '@/assets/sounds/bid.mp3';
import cardAnimationSound from '@/assets/sounds/card_animation.mp3';
import playerTurnSound from '@/assets/sounds/default.mp3';
import tableBackground from '@/assets/back.png';
import { avatars, resolveAvatarSrc } from '@/assets/catalog/avatarCatalog.js';
import {
  defaultCardBack,
  getCardAssetKey,
  getCardBackSrc,
  getCardImageSrc,
  getCardLabel,
  getRankLabel,
} from '@/assets/catalog/cardCatalog.js';
import { LoginCard } from '@/components/auth/LoginCard.jsx';
import { Button } from '@/components/ui/button.jsx';
import { useTemporaryValue } from '@/components/ui/useTemporaryValue.js';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.jsx';
import { decodeCurrentPlayerId, deckTypes } from './useGameController.js';
import { DEFAULT_LIVES, isValidLives } from '@/domain/lives.js';
import { MAX_LOBBY_PLAYERS, reducePlayerPresence } from '@/domain/playerPresence.js';
import { joinRoomErrorKey } from '../Rooms/roomNavigation.js';
import { reconnectDelay, RECONNECT_DELAYS_MS, reconnectWithSnapshot } from './reconnectPolicy.js';
import { createCardPlayGate } from './cardPlayGate.js';
import { canSubmitBid, normalizePossibleBids } from './biddingModel.js';
import { createActionTimerController } from './actionTimerController.js';
import {
  createPileVisualModel,
  getCardStrength,
  getDeckTranslationKey,
  getStrongestTurn,
  getTurnKey,
  nextRank,
} from './tableCenterModel.js';
import { storage } from '@/infrastructure/storage/storageAdapter.js';
import {
  lobbyLivesStorageKey,
  storageKeys,
} from '@/infrastructure/storage/storageKeys.js';

const MAX_DISPLAYED_LIFES = 5;
const MAX_VISIBLE_SEAT_CARDS = 6;
const CURRENT_PLAYER_SEAT_LIFT = 2;
const ROUND_END_DELAY_MS = 1000;
const PILE_WEAK_CARD_DELAY_MS = 1000;
const LIFE_LOSS_HIGHLIGHT_DURATION_MS = 3600;
const LIFE_LOSS_HIGHLIGHT_THRESHOLD = 3;
const getCurrentPlayerId = decodeCurrentPlayerId;

const getCardKey = getCardAssetKey;

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

function getJokerLabel(upcard) {
  const jokerRank = nextRank[upcard?.rank];

  return jokerRank ? getRankLabel(jokerRank) : '-';
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

function getRandomItem(items) {
  if (!items?.length) {
    return null;
  }

  return items[Math.floor(Math.random() * items.length)];
}

function getSavedPlayer() {
  const nickname = storage.getItem(storageKeys.guestNickname) || 'Guest';
  const avatarId = storage.getItem(storageKeys.guestAvatar) || '';
  const avatar = avatars.find((item) => item.id === avatarId);

  return {
    avatarSrc: avatar?.src || '',
    nickname,
  };
}

function getLobbyLifes(lobbyId, routeLifes) {
  const normalizedRouteLifes = Number(routeLifes);

  if (isValidLives(normalizedRouteLifes)) {
    return normalizedRouteLifes;
  }

  if (lobbyId) {
    const savedLifes = Number(
      storage.getItem(lobbyLivesStorageKey(lobbyId)),
    );

    if (isValidLives(savedLifes)) {
      return savedLifes;
    }
  }

  return DEFAULT_LIVES;
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

function normalizePlayer({ bid = null, fallbackId, lifes, player, ready }) {
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

export function normalizeStatusMap(statusMap, lifes, previousPlayers = {}) {
  return Object.entries(statusMap || {}).reduce((players, [id, status]) => {
    const previous = previousPlayers[id];
    const nextPlayer = normalizePlayer({
      bid: previous?.bid ?? null,
      fallbackId: id,
      lifes: previous?.lifes ?? lifes,
      player: status.player,
      ready: status.ready,
    });

    players[nextPlayer.id] = {
      ...nextPlayer,
      points: previous?.points ?? nextPlayer.points,
      turnToPlay: previous?.turnToPlay ?? nextPlayer.turnToPlay,
    };

    return players;
  }, {});
}

function getLobbyStatusMap(lobbyInfo) {
  if (lobbyInfo?.type === 'NotStarted') {
    return lobbyInfo.data;
  }

  if (lobbyInfo?.NotStarted) {
    return lobbyInfo.NotStarted;
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

export function getSnapshotStatusMap(snapshot) {
  if (snapshot?.type === 'Waiting') {
    return snapshot.status || snapshot.data;
  }

  if (snapshot?.type === 'Playing') {
    return snapshot.data?.players;
  }

  return null;
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

export function getDesktopSeatLayout(index, totalPlayers, isCurrentPlayer = false) {
  if (totalPlayers <= 1) {
    return {
      density: 'comfortable',
      left: '50%',
      top: `${60 - (isCurrentPlayer ? CURRENT_PLAYER_SEAT_LIFT : 0)}%`,
    };
  }

  const angle = Math.PI / 2 + (index * 2 * Math.PI) / totalPlayers;
  const left = 50 + Math.cos(angle) * 43;
  const top =
    50 + Math.sin(angle) * 38 - (isCurrentPlayer ? 4 : 0);

  return {
    density: totalPlayers >= 10 ? 'dense' : totalPlayers >= 7 ? 'compact' : 'comfortable',
    left: `${left.toFixed(2)}%`,
    top: `${top.toFixed(2)}%`,
  };
}

function ReadyControls({
  canToggleReady,
  hasEnoughPlayers,
  isPending,
  isReady,
  onToggleReady,
  readyCount,
  totalPlayers,
}) {
  const { t } = useTranslation();
  const buttonLabel = isPending ? t('game.readySending') : t('game.ready');

  return (
    <div className="flex w-full flex-col items-stretch justify-center gap-2 rounded-2xl border border-white/10 bg-black/80 p-2 shadow-2xl shadow-black/50 backdrop-blur sm:w-auto sm:flex-row sm:items-center">
      <button
        type="button"
        disabled={!canToggleReady}
        title={!hasEnoughPlayers ? t('game.waitingForPlayersTitle') : undefined}
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
  const lifeCount = Number.isFinite(Number(lifes))
    ? Math.max(0, Math.min(MAX_DISPLAYED_LIFES, Math.trunc(Number(lifes))))
    : 0;
  const label = t('game.lives', { count: lifeCount });

  return (
    <div className="mt-1 flex items-center gap-0.5" aria-label={label}>
      {Array.from({ length: lifeCount }).map((_, index) => (
        <img
          key={index}
          src={heartIcon}
          alt=""
          className="size-4 object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] sm:size-5"
          draggable="false"
        />
      ))}
    </div>
  );
}

export function PlayerSeat({
  avatarSrc,
  cardBackSrc,
  bid = null,
  cardCount = 0,
  isCurrent = false,
  isReady = false,
  isTurnToPlay = false,
  lifes,
  nickname,
  position,
  points,
  readyControls = null,
  showReadyState = false,
}) {
  const { t } = useTranslation();
  const scaleClass = isCurrent ? 'scale-90' : 'scale-75';
  const density = position.density || 'comfortable';
  const desktopDensityClass = density === 'dense'
    ? isCurrent ? 'md:scale-[0.7]' : 'md:scale-[0.48]'
    : density === 'compact'
      ? isCurrent ? 'md:scale-80' : 'md:scale-[0.6]'
      : isCurrent ? 'md:scale-90' : 'md:scale-75';
  const avatarBorderClass = isTurnToPlay
    ? 'border-violet-400 ring-4 ring-violet-500/45'
    : 'border-white/20 ring-0';

  return (
    <div
      role="group"
      aria-label={t('game.playerSeatAria', {
        bid: bid ?? 0,
        lifes: lifes ?? 0,
        local: isCurrent ? t('game.localPlayer') : '',
        nickname,
        points: points ?? 0,
        ready: t(isReady ? 'game.ready' : 'game.waiting'),
        turn: isTurnToPlay ? t('game.yourTurn') : '',
      })}
      className={`absolute z-10 hidden w-[min(19.8rem,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2 ${scaleClass} ${desktopDensityClass} sm:w-[21.6rem] md:block md:w-[18rem]`}
      style={{ left: position.left, top: position.top }}
    >
      <SeatCardBacks cardBackSrc={cardBackSrc} count={cardCount} />

      <div className="relative z-10 flex items-center">
        <div
          className={`relative z-20 grid size-[6.6rem] shrink-0 place-items-center overflow-hidden rounded-full border-[3px] ${avatarBorderClass} bg-black shadow-2xl shadow-black/60 sm:size-[7.7rem]`}
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

        <div
          className="-ml-5 flex min-h-20 flex-1 items-center justify-between gap-3 rounded-[2rem] bg-zinc-900/95 py-4 pl-9 pr-4 text-white shadow-2xl shadow-black/55 ring-1 ring-white/10 backdrop-blur-sm sm:min-h-24 sm:pl-11"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-5 sm:text-base">
              {nickname}{isCurrent ? ` · ${t('game.you')}` : ''}
            </p>
            <p className="mt-0.5 text-[0.65rem] font-semibold text-zinc-300">
              {t('game.bidAndPoints', { bid: bid ?? 0, points: points ?? 0 })}
              {isTurnToPlay ? ` · ${t('game.yourTurn')}` : ''}
            </p>
            <LifeHearts lifes={lifes} />
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

export function MobileTableHud({ action, currentPlayer, opponents, turnPlayerId }) {
  const { t } = useTranslation();
  if (!currentPlayer) return null;

  return (
    <section className="md:hidden" aria-label={t('game.mobileTableStatus')}>
      <div
        className="absolute left-0 right-0 top-[max(5.5rem,env(safe-area-inset-top))] z-30 flex gap-2 overflow-x-auto px-3 pb-2 landscape:top-14"
        aria-label={t('game.opponents')}
      >
        {opponents.map((player) => (
          <article
            key={player.id}
            className={`flex min-w-32 shrink-0 items-center gap-2 rounded-full border px-2 py-1.5 text-white shadow-lg ${player.id === turnPlayerId ? 'border-violet-300 bg-violet-950/90' : 'border-white/15 bg-black/80'}`}
            aria-label={`${player.nickname}; ${player.id === turnPlayerId ? t('game.yourTurn') : ''}`}
          >
            <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-full bg-zinc-800">
              {player.avatarSrc ? <img src={player.avatarSrc} alt="" className="size-full object-cover" /> : <UserRound className="size-5" />}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-bold">{player.nickname}</span>
              <span className="block text-[0.65rem] text-zinc-300">{t('game.compactPlayerStats', { bid: player.bid ?? 0, lifes: player.lifes ?? 0 })}</span>
            </span>
          </article>
        ))}
      </div>

      <article
        className={`absolute bottom-[calc(env(safe-area-inset-bottom)+10.5rem)] left-3 right-3 z-30 rounded-2xl border p-3 text-white shadow-2xl landscape:bottom-3 landscape:left-3 landscape:right-auto landscape:w-64 ${currentPlayer.id === turnPlayerId ? 'border-violet-300 bg-violet-950/90' : 'border-white/15 bg-black/85'}`}
        aria-label={t('game.localPlayer')}
        data-priority="local-player"
      >
        <div className="flex items-center justify-between gap-3">
          <strong className="truncate">{currentPlayer.nickname} · {t('game.you')}</strong>
          {currentPlayer.id === turnPlayerId ? <span className="rounded-full bg-violet-300 px-2 py-1 text-xs font-black text-violet-950">{t('game.yourTurn')}</span> : null}
        </div>
        <p className="mt-1 text-xs text-zinc-200">
          {t('game.mobilePlayerStats', { bid: currentPlayer.bid ?? 0, lifes: currentPlayer.lifes ?? 0, points: currentPlayer.points ?? 0, ready: t(currentPlayer.ready ? 'game.ready' : 'game.waiting') })}
        </p>
        {action ? <div className="mt-2">{action}</div> : null}
      </article>
    </section>
  );
}

export function TableCenter({
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
  const visualPile = createPileVisualModel(pile, elevatedPileCardKey);

  return (
    <div className="absolute left-1/2 top-1/2 z-0 flex w-[min(35rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-5 p-4 text-white sm:gap-8">
      {upcard ? (
        <div className="grid justify-items-center gap-1">
          <div
            aria-label={t('game.deckAndJokerSelected', { deck: t(getDeckTranslationKey(deckType)) })}
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
            visualPile.map(({ isElevated, key, sourceIndex, turn }) => {
              const playerName =
                playersById[turn.player_id]?.nickname || turn.player_id;

              return (
                <img
                  key={key}
                  src={getCardImageSrc(turn.card, deckType, cardBackSrc)}
                  alt={t('game.playedCardLabel', { card: getCardLabel(turn.card, t), player: playerName })}
                  title={t('game.playedCardLabel', { card: getCardLabel(turn.card, t), player: playerName })}
                  className={`pointer-events-none absolute left-1/2 top-1/2 ${pileCardSizeClass} -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 bg-white object-contain shadow-xl shadow-black/60 transition-transform duration-500 ease-out ${isElevated ? 'border-amber-300 ring-4 ring-amber-300/50' : 'border-black'}`}
                  draggable="false"
                  style={{
                    transform: `translate(-50%, -50%) translate(${sourceIndex * 22}px, ${isElevated ? '-18px' : '0'}) rotate(${sourceIndex * 5 - 8}deg)`,
                    zIndex: sourceIndex + 1,
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

export function BidControls({ onBid, pendingBid = null, possibleBids }) {
  const { t } = useTranslation();
  const allowedBids = normalizePossibleBids(possibleBids);

  if (pendingBid !== null) {
    return (
      <p role="status" className="absolute bottom-40 left-1/2 z-40 min-h-11 -translate-x-1/2 rounded-xl border border-amber-300/40 bg-black/85 px-4 py-3 text-sm font-bold text-amber-100 shadow-xl sm:bottom-73">
        {t('game.bidAwaitingServer', { number: pendingBid })}
      </p>
    );
  }

  if (!allowedBids.length) {
    return null;
  }

  return (
    <div className="absolute bottom-40 left-1/2 z-40 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap justify-center gap-2 rounded-2xl border border-white/10 bg-black/80 p-3 shadow-2xl shadow-black/50 backdrop-blur sm:bottom-73">
      {allowedBids.map((bid) => (
        <button
          key={bid}
          type="button"
          aria-label={t('game.placeBid', { number: bid })}
          className="size-12 cursor-pointer rounded-xl border border-amber-300/50 bg-amber-400 text-base font-black text-zinc-950 shadow-lg shadow-black/30 transition hover:bg-amber-300"
          onClick={() => onBid(bid)}
        >
          {bid}
        </button>
      ))}
    </div>
  );
}

export function ActionTimer({ timer }) {
  const { t } = useTranslation();

  if (!timer) {
    return null;
  }

  const label =
    timer.type === 'bid'
      ? t('game.timerBid')
      : timer.type === 'cards'
        ? t('game.timerCards')
        : t('game.timerPlay');

  return (
    <div
      className="pointer-events-none absolute left-1/2 top-4 z-50 w-[min(24rem,calc(100vw-5rem))] -translate-x-1/2 rounded-full border border-white/15 bg-black/80 px-3 py-2 text-white shadow-2xl shadow-black/50 backdrop-blur"
      aria-live="polite"
    >
      <div className="mb-1 flex items-center justify-between gap-3 text-xs font-bold uppercase tracking-wide">
        <span>{label}</span>
        <span>{timer.seconds}s</span>
      </div>
      <div className="relative h-2 overflow-hidden rounded-full bg-white/15">
        <span
          className="absolute bottom-0 right-0 top-0 rounded-full bg-amber-300 transition-[width] duration-200 ease-linear"
          style={{ width: `${timer.progress}%` }}
        />
      </div>
    </div>
  );
}

export function RoomLinkCopy({ copyText, getRoomInviteLink, lobbyId, shareRoomInvite }) {
  const { t } = useTranslation();
  const [copyStatus, setCopyStatus] = useTemporaryValue('idle');
  const roomLink = getRoomInviteLink(lobbyId);

  const copyRoomLink = async () => {
    try {
      await copyText(roomLink);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  };

  const shareRoomLink = async () => {
    try {
      const result = await shareRoomInvite({ lobbyId, title: t('game.shareRoomTitle') });
      setCopyStatus(result === 'cancelled' ? 'idle' : 'copied');
    } catch {
      setCopyStatus('failed');
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
        className="hidden size-9 shrink-0 cursor-pointer place-items-center rounded-full bg-amber-300 text-zinc-950 transition hover:bg-amber-200 md:grid"
        onClick={copyRoomLink}
      >
        {copyStatus === 'copied' ? <Check className="size-4" /> : <Copy className="size-4" />}
      </button>
      <button
        type="button"
        aria-label={t('game.shareRoomLink')}
        className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-full bg-amber-300 text-zinc-950 transition hover:bg-amber-200 md:hidden"
        onClick={shareRoomLink}
      >
        {copyStatus === 'copied' ? <Check className="size-4" /> : <Share2 className="size-4" />}
      </button>
      <span className="sr-only" role="status">
        {copyStatus === 'copied'
          ? t('game.linkCopied')
          : copyStatus === 'failed'
            ? t('game.copyFailed')
            : ''}
      </span>
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

export function PlayerHand({ canPlayCards, cardBackSrc, cards, deckType, onPlayCard }) {
  const { t } = useTranslation();
  const playGateRef = useRef(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  if (!playGateRef.current) playGateRef.current = createCardPlayGate();

  useEffect(() => {
    if (!canPlayCards) {
      playGateRef.current.reset();
      setSelectedIndex(null);
    }
  }, [canPlayCards]);

  useEffect(() => {
    if (selectedIndex !== null && !cards[selectedIndex]) setSelectedIndex(null);
  }, [cards, selectedIndex]);

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

  const selectedCard = selectedIndex === null ? null : cards[selectedIndex];
  const playSelectedCard = () => {
    if (!selectedCard || !canPlayCards) return;
    playGateRef.current.tryPlay(() => onPlayCard(selectedCard));
  };

  return (
    <>
    <div
      aria-label={t('game.playerHand')}
      className="absolute bottom-1 left-1/2 z-40 flex max-w-[calc(100vw-1rem)] touch-pan-x snap-x snap-mandatory -translate-x-1/2 translate-y-[10%] items-end justify-start overflow-x-auto overscroll-x-contain px-2 pb-3 [scrollbar-width:none] sm:bottom-3 sm:max-w-[min(92vw,82rem)] sm:justify-center sm:overflow-visible sm:px-0"
      data-testid="player-hand-scroll"
    >
      <div className="flex w-max shrink-0 items-end justify-center gap-0">
        {cards.map((card, index) => (
          <button
            key={`${getCardKey(card)}-${index}`}
            type="button"
            disabled={!canPlayCards}
            aria-pressed={selectedIndex === index}
            aria-label={t('game.selectCardLabel', { card: getCardLabel(card, t) })}
            title={getCardLabel(card, t)}
            className={`min-h-11 min-w-11 shrink-0 snap-center sm:scale-110 ${index === 0 ? '' : overlapClass} ${
              canPlayCards
                ? 'cursor-pointer active:-translate-y-3 sm:hover:-translate-y-6 sm:hover:scale-125 focus-visible:-translate-y-6 focus-visible:scale-125 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-300'
                : 'cursor-not-allowed opacity-98'
            } ${selectedIndex === index ? '-translate-y-3 ring-4 ring-amber-300 sm:-translate-y-6 sm:scale-125' : ''} transition duration-200`}
            onClick={() => setSelectedIndex(index)}
          >
            <img
              src={getCardImageSrc(card, deckType, cardBackSrc)}
              alt=""
              className={`${cardSizeClass} rounded-lg border-2 border-black bg-white object-contain shadow-2xl shadow-black/60`}
              draggable="false"
            />
          </button>
        ))}
      </div>
    </div>
    <button
      type="button"
      disabled={!canPlayCards || !selectedCard}
      className="absolute bottom-[calc(env(safe-area-inset-bottom)+11.5rem)] right-3 z-50 min-h-11 rounded-xl border border-amber-200 bg-amber-400 px-4 py-2 text-sm font-black text-zinc-950 shadow-xl disabled:cursor-not-allowed disabled:opacity-50 md:bottom-44 md:right-6"
      onClick={playSelectedCard}
    >
      {selectedCard
        ? t('game.playSelectedCard', { card: getCardLabel(selectedCard, t) })
        : t('game.selectCard')}
    </button>
    </>
  );
}

function LobbyAuthGate({
  canContinue,
  error,
  isConfirming,
  onContinue,
  onProfileSaved,
  onProfileStateChange,
  open,
  profileCardRef,
}) {
  const { t } = useTranslation();

  return (
    <Dialog open={open}>
      <DialogContent
        className="pointer-events-auto z-[70] max-w-md border-white/10 bg-zinc-950/95 p-5 text-white shadow-2xl shadow-black/50"
        showCloseButton={false}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{t('game.enterRoom')}</DialogTitle>
          <DialogDescription>
            {t('game.confirmProfile')}
          </DialogDescription>
        </DialogHeader>

        <LoginCard
          ref={profileCardRef}
          className="border-white/10 bg-black/30 p-5 shadow-none"
          onProfileStateChange={onProfileStateChange}
          onSaved={onProfileSaved}
        />

        {error ? (
          <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <DialogFooter className="-mx-5 -mb-5 border-white/10 bg-black/30 px-5">
          <Button
            type="button"
            disabled={!canContinue || isConfirming}
            className="h-11 w-full gap-2 sm:w-auto"
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

export function GameView({ controller }) {
  const {
    createGameSocket,
    clearSoundSlot,
    copyText,
    confirmRoomEntry,
    consumeGameMessage,
    getAuthToken,
    getGamePreferences,
    getGameState,
    getOnlineStatus,
    getRoomInviteLink,
    isMissingAuthTokenError,
    joinLobby,
    playTurn,
    playSound,
    playSoundOnce,
    putBid,
    sendReady,
    shareRoomInvite,
    settleReady,
    subscribeToGamePreferences,
    subscribeConnectivity,
    subscribeGameState,
  } = controller;
  const { lobbyId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const gamePreferencesRef = useRef(getGamePreferences());
  const translateRef = useRef(t);
  const localPlayerIdsRef = useRef([]);
  const playerDeckCountRef = useRef(0);
  const pileElevationTimeoutRef = useRef(null);
  const pileRef = useRef([]);
  const lifeLossHighlightTimeoutRef = useRef(null);
  const queuedRoundEndMessagesRef = useRef([]);
  const roundCardCountRef = useRef(0);
  const profileCardRef = useRef(null);
  const roundEndDelayTimeoutRef = useRef(null);
  const roundEndDelayActiveRef = useRef(false);
  const socketRef = useRef(null);
  const upcardRef = useRef(null);
  const [authGateError, setAuthGateError] = useState('');
  const [authGateOpen, setAuthGateOpen] = useState(() => !getAuthToken());
  const actionTimerControllerRef = useRef(null);
  if (!actionTimerControllerRef.current) {
    actionTimerControllerRef.current = createActionTimerController();
  }
  const [actionTimer, setActionTimer] = useState(() => actionTimerControllerRef.current.getState());
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
  const [isOffline, setIsOffline] = useState(() => !getOnlineStatus());
  const [sharedGameState, setSharedGameState] = useState(() => getGameState());
  const [isReadySending, setIsReadySending] = useState(false);
  const [matchPhase, setMatchPhase] = useState('waiting');
  const [elevatedPileCardKey, setElevatedPileCardKey] = useState('');
  const [pile, setPile] = useState([]);
  const [playerDeck, setPlayerDeck] = useState([]);
  const [playedCardAnimation, setPlayedCardAnimation] = useState(null);
  const [possibleBids, setPossibleBids] = useState([]);
  const [pendingBid, setPendingBid] = useState(null);
  const [roundCardCount, setRoundCardCount] = useState(0);
  const [turnPlayerId, setTurnPlayerId] = useState(null);
  const [upcard, setUpcard] = useState(null);

  const selectedCardBackSrc = useMemo(
    () => getCardBackSrc(gamePreferences.cardBack),
    [gamePreferences.cardBack],
  );

  const resolvedCurrentPlayerId = useMemo(() => {
    return resolveCurrentPlayerId(playersById, currentPlayerId);
  }, [currentPlayerId, playersById]);

  const tablePlayers = useMemo(() => {
    return sortPlayers(Object.values(playersById), resolvedCurrentPlayerId).slice(
      0,
      MAX_LOBBY_PLAYERS,
    );
  }, [playersById, resolvedCurrentPlayerId]);

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
    playerDeckCountRef.current = playerDeck.length;
  }, [playerDeck.length]);

  useEffect(() => {
    roundCardCountRef.current = roundCardCount;
  }, [roundCardCount]);

  const playedCountsByPlayer = useMemo(
    () => getPlayedCountsByPlayer(pile),
    [pile],
  );
  const isWaitingForReady = matchPhase === 'waiting';
  const isCurrentPlayerTurn = Boolean(
    currentPlayer?.turnToPlay ||
      (turnPlayerId && localPlayerIds.includes(turnPlayerId)),
  );
  const canPlayCards = Boolean(
    gameStage === 'dealing' &&
      hasGameSocket &&
      isCurrentPlayerTurn &&
      playerDeck.length,
  );
  const hasEnoughPlayers = totalPlayers > 1;
  const canToggleReady = Boolean(
    hasGameSocket &&
      isWaitingForReady &&
      hasEnoughPlayers &&
      !isReadySending,
  );

  const playConfiguredSound = (soundSrc) => {
    playSound(soundSrc, gamePreferencesRef.current.volume);
  };

  const clearTurnPromptSound = () => {
    clearSoundSlot('turn-prompt');
  };

  const playTurnPromptSound = (type, playerId) => {
    const soundKey = `${type}:${playerId}`;
    playSoundOnce(
      'turn-prompt',
      soundKey,
      type === 'bid' ? bidTurnSound : playerTurnSound,
      gamePreferencesRef.current.volume,
    );
  };

  const clearActionTimer = useCallback(() => {
    actionTimerControllerRef.current.clear();
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

  const startActionTimer = useCallback((type, cardCount) => {
    actionTimerControllerRef.current.start(type, cardCount);
  }, []);

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

  useEffect(() => subscribeConnectivity(({ online }) => {
    setIsOffline(!online);
    if (online) setJoinAttempt((attempt) => attempt + 1);
  }), []);

  useEffect(() => subscribeGameState(setSharedGameState), []);

  useEffect(() => {
    const timerController = actionTimerControllerRef.current;
    const unsubscribe = timerController.subscribe(setActionTimer);
    return () => {
      unsubscribe();
      timerController.destroy();
    };
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
      await confirmRoomEntry({
        persistProfile: () => profileCardRef.current?.saveIfNeeded?.(),
        onConfirmed: () => {
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
        },
      });
    } catch (error) {
      setAuthGateError(
        error.code === 'profile_confirmation_required'
          ? t('game.authSaveGuest')
          : error.message || t('game.confirmProfileError'),
      );
    } finally {
      setIsProfileConfirming(false);
    }
  };

  useEffect(() => {
    const nextLifes = getLobbyLifes(lobbyId, location.state?.lifes);
    const nextCurrentPlayerId = getCurrentPlayerId();
    const token = getAuthToken();

    setLifes(nextLifes);
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
    roundCardCountRef.current = 0;
    setPile([]);
    setPlayerDeck([]);
    setPlayedCardAnimation(null);
    setPossibleBids([]);
    setPendingBid(null);
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
      setPendingBid(null);
      setMatchPhase('playing');
      updateUpcard(gameInfo.upcard || null);
      setTurnPlayerId(gameInfo.current_player || null);
      setGameStage(gameInfo.stage?.type === 'Bidding' ? 'bidding' : 'dealing');

      if (localPlayerId) {
        setCurrentPlayerId(localPlayerId);
      }

      if (Array.isArray(gameInfo.deck)) {
        updatePlayerDeck(gameInfo.deck);
        updateRoundCardCount(gameInfo.deck.length);
      }

      if (
        gameInfo.stage?.type === 'Bidding' &&
        localPlayerIds.includes(gameInfo.current_player)
      ) {
        setPossibleBids(normalizePossibleBids(gameInfo.stage.data?.possible_bids));
        startActionTimer(
          'bid',
          getActionCardCount(
            Math.max(...(gameInfo.stage.data?.possible_bids || [0])),
          ),
        );
        playTurnPromptSound('bid', gameInfo.current_player);
      } else if (
        gameInfo.stage?.type === 'Dealing' &&
        localPlayerIds.includes(gameInfo.current_player)
      ) {
        startActionTimer('play', getActionCardCount());
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
      consumeGameMessage(message);
      switch (message.type) {
        case 'Snapshot': {
          if (message.data?.type === 'Waiting') {
            setGameStage('waiting');
            setMatchPhase('waiting');
            clearPileElevation();
            updatePile([]);
            updatePlayerDeck([]);
            setPlayedCardAnimation(null);
            setGameEndSummary(null);
            clearLifeLossHighlight();
            setPossibleBids([]);
            setPendingBid(null);
            updateRoundCardCount(0);
            setTurnPlayerId(null);
            updateUpcard(null);
          }

          const statusMap = getSnapshotStatusMap(message.data);
          const gameInfo = getGameInfoFromSnapshot(message.data);

          if (statusMap) {
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

            return reducePlayerPresence(previousPlayers, {
              type: 'PlayerJoined',
              player,
            });
          });
          break;
        }
        case 'PlayerLeft':
          setPlayersById((previousPlayers) => reducePlayerPresence(previousPlayers, {
            type: 'PlayerLeft',
            playerId: message.data.player_id,
          }));
          break;
        case 'PlayerStatusChange':
          settleReady();
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
        case 'PlayerBidded':
          clearTurnPromptSound();
          clearActionTimer();
          setGameStage('bidding');
          setMatchPhase('playing');
          setPossibleBids([]);
          setPendingBid(null);
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
          setPendingBid(null);
          setIsReadySending(false);
          setGameStage('bidding');
          setMatchPhase('playing');
          setTurnPlayerId(message.data.player_id);
          if (isLocalPlayerId(message.data.player_id)) {
            setPossibleBids(normalizePossibleBids(message.data.possible_bids));
            startActionTimer(
              'bid',
              getActionCardCount(Math.max(...(message.data.possible_bids || [0]))),
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
        case 'PlayerDeck':
          setIsReadySending(false);
          setMatchPhase('playing');
          updatePlayerDeck(message.data || []);
          updateRoundCardCount((message.data || []).length);
          startActionTimer('cards', (message.data || []).length);
          break;
        case 'PlayerTurn':
          setIsReadySending(false);
          setGameStage('dealing');
          setMatchPhase('playing');
          setPossibleBids([]);
          setTurnPlayerId(message.data.player_id);
          if (isLocalPlayerId(message.data.player_id)) {
            startActionTimer('play', getActionCardCount());
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

    const applyLobbyInfo = (lobbyInfo) => {
      const latestCurrentPlayerId = getCurrentPlayerId();
      const statusMap = getLobbyStatusMap(lobbyInfo);
      const gameInfo = getLobbyGameInfo(lobbyInfo);

      if (latestCurrentPlayerId) setCurrentPlayerId(latestCurrentPlayerId);
      if (statusMap) {
        setMatchPhase('waiting');
        applyStatusMap(statusMap);
      }
      if (gameInfo) {
        applyGameState(gameInfo, statusMap);
        setPlayersById((previousPlayers) =>
          applyGameInfo(previousPlayers, gameInfo, nextLifes),
        );
      }
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

      if (!getOnlineStatus()) {
        setIsOffline(true);
        setIsReconnecting(false);
        return;
      }

      if (reconnectAttempt >= RECONNECT_DELAYS_MS.length) {
        setIsReconnecting(false);
        setJoinError(translateRef.current('game.socketError'));
        return;
      }

      const delayMs = reconnectDelay(reconnectAttempt);
      reconnectAttempt += 1;

      reconnectTimeoutId = window.setTimeout(() => {
        reconnectTimeoutId = null;
        reconnectWithSnapshot({
          join: () => joinLobby(lobbyId),
          applySnapshot: (lobbyInfo) => {
            if (isCurrent) applyLobbyInfo(lobbyInfo);
          },
          connect: () => {
            if (isCurrent) connectSocket();
          },
        })
          .catch((error) => {
            if (!isCurrent) return;
            if ([403, 404, 409].includes(error?.status)) {
              setIsReconnecting(false);
              setJoinError(translateRef.current(joinRoomErrorKey(error)));
              return;
            }
            scheduleReconnect();
          });
      }, delayMs);
    }

    function connectSocket() {
      if (!isCurrent) {
        return;
      }

      const latestToken = getAuthToken();

      if (!latestToken) {
        setIsReconnecting(false);
        setAuthGateOpen(true);
        setAuthGateError(translateRef.current('game.missingAuth'));
        return;
      }

      let nextSocket = null;

      try {
        nextSocket = createGameSocket({
          onClose: () => {
            if (!isCurrent || socketRef.current !== nextSocket) {
              return;
            }

            settleReady();
            socketRef.current = null;
            socket = null;
            setHasGameSocket(false);
            setIsReadySending(false);
            clearActionTimer();
            scheduleReconnect();
          },
          onError: () => {
            if (!isCurrent || socketRef.current !== nextSocket) {
              return;
            }

            settleReady();
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

    joinLobby(lobbyId)
      .then((lobbyInfo) => {
        if (!isCurrent) {
          return;
        }
        applyLobbyInfo(lobbyInfo);
        connectSocket();
      })
      .catch((error) => {
        if (isCurrent) {
          if (isMissingAuthTokenError(error) || !getAuthToken()) {
            setAuthGateOpen(true);
            setAuthGateError(translateRef.current('game.missingAuth'));
            setJoinError('');
          } else {
            setJoinError(translateRef.current(joinRoomErrorKey(error)));
          }
        }
      });

    return () => {
      isCurrent = false;
      settleReady();
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
    showLifeLossHighlight,
    startActionTimer,
  ]);

  const toggleReady = () => {
    if (!canToggleReady || !socketRef.current) {
      return;
    }

    try {
      const sent = sendReady({
        playerCount: totalPlayers,
        ready: Boolean(currentPlayer?.ready),
        socket: socketRef.current,
        socketOpen: hasGameSocket,
      });
      if (!sent) return;
      setIsReadySending(true);
    } catch (error) {
      settleReady();
      setIsReadySending(false);
      setJoinError(error.message || t('game.readyError'));
    }
  };

  const sendBid = (bid) => {
    if (!socketRef.current || pendingBid !== null || !canSubmitBid(possibleBids, bid)) {
      return;
    }

    const allowedBids = possibleBids;
    setPendingBid(bid);
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
      setPendingBid(null);
      setPossibleBids(allowedBids);
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

  const handleActionTimerExpire = () => {
    const randomBid = getRandomItem(possibleBids);

    if (randomBid !== null) {
      sendBid(randomBid);
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

  useEffect(() => {
    actionTimerControllerRef.current.setOnExpire(handleActionTimerExpire);
  }, [handleActionTimerExpire]);

  return (
    <main
      data-game-phase={sharedGameState.phase}
      aria-label={t('game.tableAria')}
      className="relative min-h-screen overflow-hidden bg-black"
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat landscape:bg-cover"
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

      <ActionTimer timer={actionTimer} />

      {isWaitingForReady && lobbyId ? (
        <RoomLinkCopy copyText={copyText} getRoomInviteLink={getRoomInviteLink} lobbyId={lobbyId} shareRoomInvite={shareRoomInvite} />
      ) : null}

      <MobileTableHud
        action={isWaitingForReady && currentPlayer ? (
          <ReadyControls
            canToggleReady={canToggleReady}
            hasEnoughPlayers={hasEnoughPlayers}
            isPending={isReadySending}
            isReady={currentPlayer.ready}
            onToggleReady={toggleReady}
            readyCount={readyCount}
            totalPlayers={totalPlayers}
          />
        ) : null}
        currentPlayer={currentPlayer}
        opponents={tablePlayers.filter((player) => player.id !== resolvedCurrentPlayerId)}
        turnPlayerId={turnPlayerId}
      />

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
            cardCount={cardCount}
            isCurrent={isCurrentPlayer}
            isReady={player.ready}
            isTurnToPlay={player.turnToPlay || player.id === turnPlayerId}
            lifes={player.lifes ?? lifes}
            nickname={player.nickname}
            position={getDesktopSeatLayout(
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
                  onToggleReady={toggleReady}
                  readyCount={readyCount}
                  totalPlayers={totalPlayers}
                />
              ) : null
            }
            showReadyState={isWaitingForReady}
          />
        );
      })}

      <BidControls
        onBid={sendBid}
        pendingBid={pendingBid}
        possibleBids={hasGameSocket ? possibleBids : []}
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
        <div role="alert" className="absolute left-1/2 top-6 z-20 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-destructive/50 bg-background/90 px-4 py-3 text-center text-sm text-destructive shadow-lg backdrop-blur">
          {joinError}
        </div>
      ) : null}

      {isOffline && !joinError ? (
        <div role="status" className="absolute left-1/2 top-6 z-20 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-orange-300/40 bg-black/85 px-4 py-3 text-center text-sm font-semibold text-orange-100 shadow-lg backdrop-blur">
          {t('game.offline')}
        </div>
      ) : null}

      {isReconnecting && !isOffline && !joinError ? (
        <div className="absolute left-1/2 top-6 z-20 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-amber-300/40 bg-black/85 px-4 py-3 text-center text-sm font-semibold text-amber-100 shadow-lg backdrop-blur">
          {t('game.reconnecting')}
        </div>
      ) : null}

      <LobbyAuthGate
        canContinue={
          Boolean(lobbyId) && !isProfileConfirming && !profileGateState.isSaving
        }
        error={authGateError}
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
