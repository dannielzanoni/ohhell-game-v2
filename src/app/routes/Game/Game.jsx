import { useEffect, useMemo, useRef, useState } from 'react';
import { UserRound } from 'lucide-react';
import { useLocation, useParams } from 'react-router-dom';
import cardBack from '@/assets/cards/back_card3.png';
import heartIcon from '@/assets/icons/heart.png';
import tableBackground from '@/assets/back.png';
import { avatars } from '@/components/auth/AvatarEditModal.jsx';
import { getAuthToken } from '@/services/apiClient.js';
import {
  createGameSocket,
  playTurn,
  putBid,
  setPlayerReady,
} from '@/services/gameSocketService.js';
import { joinLobby } from '@/services/lobbyService.js';

const MAX_TABLE_PLAYERS = 10;
const MAX_DISPLAYED_LIFES = 5;
const MAX_VISIBLE_SEAT_CARDS = 6;
const CURRENT_PLAYER_SEAT_LIFT = 2;
const spanishCardImages = import.meta.glob('/src/assets/cards/spanish/*.jpg', {
  eager: true,
  import: 'default',
});
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

  return payload?.id || payload?.email || null;
}

function getCardKey(card) {
  if (!card) {
    return '';
  }

  const rank = rankToAsset[card.rank];
  const suit = suitToAsset[card.suit];

  return rank && suit ? `${rank}${suit}` : '';
}

function getCardImageSrc(card) {
  const key = getCardKey(card);

  return spanishCardImages[`/src/assets/cards/spanish/${key}.jpg`] || cardBack;
}

function getCardLabel(card) {
  if (!card) {
    return '';
  }

  const rank = rankLabels[card.rank] || card.rank;
  const suit = suitLabels[card.suit] || card.suit;

  return `${rank} de ${suit}`;
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
    return player.data?.name || player.data?.email || fallbackId;
  }

  return player?.data?.nickname || player?.name || player?.id || fallbackId;
}

function getClaimsPicture(player) {
  if (player?.type === 'Anonymous') {
    return player.data?.data?.picture || '';
  }

  if (player?.type === 'Google') {
    return player.data?.picture || '';
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

function normalizeStatusMap(statusMap, lifes, previousPlayers = {}) {
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

function getSnapshotStatusMap(snapshot) {
  if (snapshot?.type === 'Waiting') {
    return snapshot.data;
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
  onToggleReady,
  readyCount,
  totalPlayers,
}) {
  const buttonLabel = isPending ? 'Enviando...' : isReady ? 'Pronto' : 'Ready';

  return (
    <div className="flex w-full flex-col items-stretch justify-center gap-2 rounded-2xl border border-white/10 bg-black/80 p-2 shadow-2xl shadow-black/50 backdrop-blur sm:w-auto sm:flex-row sm:items-center">
      <button
        type="button"
        disabled={!canToggleReady}
        title={!hasEnoughPlayers ? 'Aguardando pelo menos 2 players' : undefined}
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
        {readyCount}/{totalPlayers} players ready
      </span>
    </div>
  );
}

function ReadyStatusBadge({ isReady }) {
  return (
    <div
      className={`absolute left-1/2 top-full mt-3 -translate-x-1/2 rounded-full border px-3 py-2 text-xs font-semibold shadow-lg ${
        isReady
          ? 'border-emerald-400/50 bg-emerald-500 text-emerald-950'
          : 'border-white/10 bg-black/75 text-white'
      }`}
    >
      {isReady ? 'Ready' : 'Waiting'}
    </div>
  );
}

function SeatCardBacks({ count }) {
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
          src={cardBack}
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
  const bidCount = Number(bid);
  const completedCount = Number(points) || 0;

  if (!Number.isFinite(bidCount) || bidCount <= 0) {
    return null;
  }

  return (
    <div className="relative z-20 flex justify-center">
      {Array.from({ length: bidCount }).map((_, index) => {
        const isChecked = index < completedCount;

        return (
          <input
            type="checkbox"
            checked={isChecked}
            readOnly
            key={index}
            aria-label={`Bid ${index + 1} ${isChecked ? 'feito' : 'pendente'}`}
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
  const lifeCount = Number.isFinite(Number(lifes))
    ? Math.max(0, Math.min(MAX_DISPLAYED_LIFES, Math.trunc(Number(lifes))))
    : 0;
  const label = lifeCount === 1 ? '1 vida' : `${lifeCount} vidas`;

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

function PlayerSeat({
  avatarSrc,
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
  const scaleClass = isCurrent ? 'scale-90' : 'scale-75';
  const avatarBorderClass = isTurnToPlay
    ? 'border-violet-400 ring-4 ring-violet-500/45'
    : 'border-white/20 ring-0';

  return (
    <div
      className={`absolute z-10 w-[min(19.8rem,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2 ${scaleClass} sm:w-[21.6rem]`}
      style={position}
    >
      <SeatCardBacks count={cardCount} />

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
              {nickname}
            </p>
            <LifeHearts lifes={lifes} />
          </div>

          <div
            aria-label="Bid escolhido"
            className="grid h-11 min-w-11 shrink-0 place-items-center rounded-2xl border border-white/10 bg-black/45 px-3 text-base font-bold text-white shadow-inner shadow-black/40 sm:h-12 sm:min-w-12"
          >
            {bid ?? '-'}
          </div>
        </div>
      </div>

      <BidProgress bid={bid} points={points} />

      {showReadyState && isCurrent && readyControls ? (
        <div className="absolute left-1/2 top-full z-30 mt-3 w-[min(26rem,calc(100vw-2rem))] -translate-x-1/2 sm:w-auto">
          {readyControls}
        </div>
      ) : null}

      {showReadyState && !isCurrent ? <ReadyStatusBadge isReady={isReady} /> : null}
    </div>
  );
}

function TableCenter({ pile, playersById, upcard }) {
  if (!upcard && pile.length === 0) {
    return null;
  }

  return (
    <div className="absolute left-1/2 top-1/2 z-0 flex w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-5 rounded-3xl border border-white/10 bg-black/35 p-4 text-white shadow-2xl shadow-black/50 backdrop-blur-sm sm:gap-8">
      {upcard ? (
        <div className="grid justify-items-center gap-2">
          <img
            src={getCardImageSrc(upcard)}
            alt={getCardLabel(upcard)}
            className="h-24 w-16 rounded-lg border-2 border-black object-cover shadow-xl shadow-black/50 sm:h-32 sm:w-[5.4rem]"
            draggable="false"
          />
        </div>
      ) : null}

      <div className="grid min-w-28 justify-items-center gap-2">
        <div className="relative h-28 w-32 sm:h-36 sm:w-44">
          {pile.length ? (
            pile.map((turn, index) => {
              const playerName =
                playersById[turn.player_id]?.nickname || turn.player_id;

              return (
                <img
                  key={`${turn.player_id}-${getCardKey(turn.card)}-${index}`}
                  src={getCardImageSrc(turn.card)}
                  alt={`${playerName}: ${getCardLabel(turn.card)}`}
                  title={`${playerName}: ${getCardLabel(turn.card)}`}
                  className="absolute left-1/2 top-1/2 h-24 w-16 -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 border-black object-cover shadow-xl shadow-black/60 sm:h-32 sm:w-[5.4rem]"
                  draggable="false"
                  style={{
                    transform: `translate(-50%, -50%) translateX(${index * 20}px) rotate(${index * 5 - 8}deg)`,
                    zIndex: index + 1,
                  }}
                />
              );
            })
          ) : (
            <div className="grid h-full place-items-center rounded-2xl border border-dashed border-white/15 bg-black/35 px-4 text-center text-xs text-zinc-300">
             
            </div>
          )}
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
    <div className="absolute bottom-36 left-1/2 z-40 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap justify-center gap-2 rounded-2xl border border-white/10 bg-black/80 p-3 shadow-2xl shadow-black/50 backdrop-blur sm:bottom-68">
      {possibleBids.map((bid) => (
        <button
          key={bid}
          type="button"
          className="size-12 cursor-pointer rounded-2xl border border-amber-300/60 bg-amber-400 text-base font-black text-zinc-950 shadow-lg shadow-black/30 transition hover:bg-amber-300"
          onClick={() => onBid(bid)}
        >
          {bid}
        </button>
      ))}
    </div>
  );
}

function PlayedCardAnimation({ card, onAnimationEnd }) {
  if (!card) {
    return null;
  }

  return (
    <img
      src={getCardImageSrc(card)}
      alt=""
      className="ohhell-card-play-animation absolute bottom-8 left-1/2 z-50 h-[7.7rem] w-[5.2rem] rounded-lg border-2 border-black object-cover shadow-2xl shadow-black/70 sm:h-[9.9rem] sm:w-[6.6rem]"
      draggable="false"
      onAnimationEnd={onAnimationEnd}
    />
  );
}

function PlayerHand({ canPlayCards, cards, onPlayCard }) {
  if (!cards.length) {
    return null;
  }

  const overlapRem =
    cards.length >= 16 ? 4.1 : cards.length >= 12 ? 3.2 : 1.25;

  return (
    <div className="absolute bottom-1 left-1/2 z-40 flex max-w-[calc(100vw-1rem)] -translate-x-1/2 translate-y-[10%] items-end justify-center overflow-x-auto px-2 pb-3 sm:bottom-3 sm:max-w-[min(92vw,82rem)] sm:overflow-visible sm:px-0">
      <div className="flex items-end justify-center gap-0">
        {cards.map((card, index) => (
          <button
            key={`${getCardKey(card)}-${index}`}
            type="button"
            disabled={!canPlayCards}
            title={getCardLabel(card)}
            className={`scale-110 ${
              canPlayCards
                ? 'cursor-pointer hover:-translate-y-6 hover:scale-125'
                : 'cursor-not-allowed opacity-98'
            } transition duration-200`}
            style={{ marginLeft: index === 0 ? 0 : `-${overlapRem}rem` }}
            onClick={() => onPlayCard(card)}
          >
            <img
              src={getCardImageSrc(card)}
              alt={getCardLabel(card)}
              className="h-[7.7rem] w-[5.2rem] rounded-lg border-2 border-black object-cover shadow-2xl shadow-black/60 sm:h-[9.9rem] sm:w-[6.6rem]"
              draggable="false"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export function Game() {
  const { lobbyId } = useParams();
  const location = useLocation();
  const localPlayerIdsRef = useRef([]);
  const socketRef = useRef(null);
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
  const [joinError, setJoinError] = useState('');
  const [gameStage, setGameStage] = useState('waiting');
  const [hasGameSocket, setHasGameSocket] = useState(false);
  const [isReadySending, setIsReadySending] = useState(false);
  const [matchPhase, setMatchPhase] = useState('waiting');
  const [pile, setPile] = useState([]);
  const [playerDeck, setPlayerDeck] = useState([]);
  const [playedCardAnimation, setPlayedCardAnimation] = useState(null);
  const [possibleBids, setPossibleBids] = useState([]);
  const [roundCardCount, setRoundCardCount] = useState(0);
  const [turnPlayerId, setTurnPlayerId] = useState(null);
  const [upcard, setUpcard] = useState(null);

  const resolvedCurrentPlayerId = useMemo(() => {
    return resolveCurrentPlayerId(playersById, currentPlayerId);
  }, [currentPlayerId, playersById]);

  const tablePlayers = useMemo(() => {
    return sortPlayers(Object.values(playersById), resolvedCurrentPlayerId).slice(
      0,
      MAX_TABLE_PLAYERS,
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

  useEffect(() => {
    const nextLifes = getLobbyLifes(lobbyId, location.state?.lifes);
    const nextCurrentPlayerId = getCurrentPlayerId();

    setLifes(nextLifes);
    setCurrentPlayerId(nextCurrentPlayerId);
    setGameStage('waiting');
    setJoinError('');
    setHasGameSocket(false);
    setIsReadySending(false);
    setMatchPhase('waiting');
    setPile([]);
    setPlayerDeck([]);
    setPlayedCardAnimation(null);
    setPossibleBids([]);
    setRoundCardCount(0);
    setTurnPlayerId(null);
    setUpcard(null);

    if (!lobbyId) {
      return undefined;
    }

    let isCurrent = true;
    let socket = null;

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

    const isLocalPlayerId = (playerId) => {
      const latestCurrentPlayerId = getCurrentPlayerId();
      const candidateIds = [
        nextCurrentPlayerId,
        latestCurrentPlayerId,
        ...localPlayerIdsRef.current,
      ].filter(Boolean);

      return candidateIds.includes(playerId);
    };

    const applyGameState = (gameInfo) => {
      if (!gameInfo) {
        return;
      }

      setIsReadySending(false);
      setMatchPhase('playing');
      setUpcard(gameInfo.upcard || null);
      setTurnPlayerId(gameInfo.current_player || null);
      setGameStage(gameInfo.stage?.type === 'Bidding' ? 'bidding' : 'dealing');

      if (Array.isArray(gameInfo.deck)) {
        setPlayerDeck(gameInfo.deck);
        setRoundCardCount(gameInfo.deck.length);
      }

      if (
        gameInfo.stage?.type === 'Bidding' &&
        isLocalPlayerId(gameInfo.current_player)
      ) {
        setPossibleBids(gameInfo.stage.data?.possible_bids || []);
      } else {
        setPossibleBids([]);
      }
    };

    const handleServerMessage = (message) => {
      if (!isCurrent) {
        return;
      }

      switch (message.type) {
        case 'Snapshot': {
          if (message.data?.type === 'Waiting') {
            setGameStage('waiting');
            setMatchPhase('waiting');
            setPile([]);
            setPlayerDeck([]);
            setPlayedCardAnimation(null);
            setPossibleBids([]);
            setRoundCardCount(0);
            setTurnPlayerId(null);
            setUpcard(null);
          }

          const statusMap = getSnapshotStatusMap(message.data);
          const gameInfo = getGameInfoFromSnapshot(message.data);

          if (statusMap) {
            applyStatusMap(statusMap, gameInfo);
          }
          if (gameInfo) {
            applyGameState(gameInfo);
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

            return {
              ...previousPlayers,
              [player.id]: {
                ...previousPlayers[player.id],
                ...player,
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
        case 'PlayerBidded':
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
        case 'RoundEnded':
          setGameStage('dealing');
          setMatchPhase('playing');
          setPile([]);
          setRoundCardCount((currentCount) => Math.max(0, currentCount - 1));
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
          break;
        case 'PlayerBiddingTurn':
          setIsReadySending(false);
          setGameStage('bidding');
          setMatchPhase('playing');
          setTurnPlayerId(message.data.player_id);
          setPossibleBids(
            isLocalPlayerId(message.data.player_id)
              ? message.data.possible_bids || []
              : [],
          );
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
          setPlayerDeck(message.data || []);
          setRoundCardCount((message.data || []).length);
          break;
        case 'PlayerTurn':
          setIsReadySending(false);
          setGameStage('dealing');
          setMatchPhase('playing');
          setPossibleBids([]);
          setTurnPlayerId(message.data.player_id);
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
          setIsReadySending(false);
          setGameStage('dealing');
          setMatchPhase('playing');
          setPossibleBids([]);
          setPile(message.data?.pile || []);
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
              setPlayerDeck((currentDeck) =>
                removeCardFromDeck(currentDeck, turn.card),
              );
            }
          });
          break;
        case 'SetStart':
          setIsReadySending(false);
          setGameStage('bidding');
          setMatchPhase('playing');
          setPile([]);
          setPlayerDeck([]);
          setPlayedCardAnimation(null);
          setPossibleBids([]);
          setRoundCardCount(0);
          setTurnPlayerId(null);
          setUpcard(message.data.upcard);
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
          setGameStage('dealing');
          setMatchPhase('playing');
          setPile([]);
          setPossibleBids([]);
          setRoundCardCount(0);
          setPlayersById((previousPlayers) => {
            const nextPlayers = { ...previousPlayers };

            Object.entries(message.data.lifes || {}).forEach(([playerId, life]) => {
              const existing =
                nextPlayers[playerId] || createFallbackPlayer(playerId, nextLifes);

              nextPlayers[playerId] = {
                ...existing,
                lifes: life,
                points: 0,
              };
            });

            return nextPlayers;
          });
          break;
        case 'GameEnded':
          setIsReadySending(false);
          setGameStage('ended');
          setMatchPhase('ended');
          setPile([]);
          setPlayerDeck([]);
          setPlayedCardAnimation(null);
          setPossibleBids([]);
          setRoundCardCount(0);
          setTurnPlayerId(null);
          setUpcard(null);
          setPlayersById((previousPlayers) => {
            const nextPlayers = { ...previousPlayers };

            Object.entries(message.data.lifes || {}).forEach(([playerId, life]) => {
              const existing =
                nextPlayers[playerId] || createFallbackPlayer(playerId, nextLifes);

              nextPlayers[playerId] = {
                ...existing,
                lifes: life,
                points: 0,
                ready: false,
                turnToPlay: false,
              };
            });

            return nextPlayers;
          });
          break;
        case 'Error':
          setIsReadySending(false);
          setJoinError(message.data.msg || 'Erro na conexao da sala.');
          break;
        default:
          break;
      }
    };

    joinLobby(lobbyId)
      .then((lobbyInfo) => {
        if (!isCurrent) {
          return;
        }

        const statusMap = getLobbyStatusMap(lobbyInfo);
        const gameInfo = getLobbyGameInfo(lobbyInfo);

        if (statusMap) {
          setMatchPhase('waiting');
          applyStatusMap(statusMap);
        }

        if (gameInfo) {
          applyGameState(gameInfo);
          setPlayersById((previousPlayers) =>
            applyGameInfo(previousPlayers, gameInfo, nextLifes),
          );
        }

        socket = createGameSocket({
          onClose: () => {
            if (isCurrent) {
              setHasGameSocket(false);
              setIsReadySending(false);
            }
          },
          onError: () => {
            if (isCurrent) {
              setHasGameSocket(false);
              setIsReadySending(false);
              setJoinError('Erro na conexao em tempo real da sala.');
            }
          },
          onMessage: handleServerMessage,
          onOpen: () => {
            if (isCurrent) {
              setHasGameSocket(true);
            }
          },
        });
        socketRef.current = socket;
        setHasGameSocket(true);
      })
      .catch((error) => {
        if (isCurrent) {
          setJoinError(error.message || 'Nao foi possivel entrar na sala.');
        }
      });

    return () => {
      isCurrent = false;
      setHasGameSocket(false);
      setIsReadySending(false);

      if (socket) {
        socket.close();
      }

      if (socketRef.current === socket) {
        socketRef.current = null;
      }
    };
  }, [lobbyId, location.state?.lifes]);

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
      setJoinError(error.message || 'Nao foi possivel marcar ready.');
    }
  };

  const sendBid = (bid) => {
    if (!socketRef.current || !possibleBids.includes(bid)) {
      return;
    }

    setPossibleBids([]);
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
      setJoinError(error.message || 'Nao foi possivel enviar o bid.');
    }
  };

  const handlePlayCard = (card) => {
    if (!socketRef.current) {
      setJoinError('Conexao da partida ainda nao esta pronta.');
      return;
    }

    if (gameStage !== 'dealing') {
      setJoinError('Aguarde a fase de jogada para jogar uma carta.');
      return;
    }

    if (!isCurrentPlayerTurn) {
      setJoinError('Aguarde sua vez para jogar.');
      return;
    }

    try {
      setJoinError('');
      setPlayedCardAnimation({
        card,
        id: `${Date.now()}-${getCardKey(card)}`,
      });
      playTurn(socketRef.current, card);
      setPlayerDeck((currentDeck) => removeCardFromDeck(currentDeck, card));
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
      setJoinError(error.message || 'Nao foi possivel jogar a carta.');
    }
  };

  return (
    <main
      aria-label="Oh Hell game table"
      className="relative min-h-screen overflow-hidden bg-black"
    >
      <div
        className="absolute left-1/2 top-1/2 h-screen w-[130vh] -translate-x-1/2 -translate-y-1/2 rotate-90 scale-80 bg-cover bg-center bg-no-repeat sm:h-full sm:w-full sm:rotate-0 sm:scale-100"
        style={{ backgroundImage: `url(${tableBackground})` }}
      />

      <TableCenter pile={pile} playersById={playersById} upcard={upcard} />

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
            bid={player.bid}
            cardCount={cardCount}
            isCurrent={isCurrentPlayer}
            isReady={player.ready}
            isTurnToPlay={player.turnToPlay || player.id === turnPlayerId}
            lifes={player.lifes ?? lifes}
            nickname={player.nickname}
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

      <BidControls onBid={sendBid} possibleBids={possibleBids} />
      <PlayerHand
        canPlayCards={canPlayCards}
        cards={playerDeck}
        onPlayCard={handlePlayCard}
      />
      <PlayedCardAnimation
        key={playedCardAnimation?.id}
        card={playedCardAnimation?.card}
        onAnimationEnd={() => setPlayedCardAnimation(null)}
      />

      {joinError ? (
        <div className="absolute left-1/2 top-6 z-20 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-destructive/50 bg-background/90 px-4 py-3 text-center text-sm text-destructive shadow-lg backdrop-blur">
          {joinError}
        </div>
      ) : null}
    </main>
  );
}
