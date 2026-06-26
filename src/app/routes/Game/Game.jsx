import { useEffect, useMemo, useRef, useState } from 'react';
import { UserRound } from 'lucide-react';
import { useLocation, useParams } from 'react-router-dom';
import cardBack from '@/assets/cards/back_card3.png';
import heartIcon from '@/assets/icons/heart.png';
import tableBackground from '@/assets/back.png';
import { avatars } from '@/components/auth/AvatarEditModal.jsx';
import { getAuthToken } from '@/services/apiClient.js';
import { createGameSocket, setPlayerReady } from '@/services/gameSocketService.js';
import { joinLobby } from '@/services/lobbyService.js';

const MAX_TABLE_PLAYERS = 10;
const MAX_DISPLAYED_LIFES = 5;

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

function getSeatPosition(index, totalPlayers) {
  if (totalPlayers <= 1) {
    return { left: '50%', top: '76%' };
  }

  const angle = Math.PI / 2 + (index * 2 * Math.PI) / totalPlayers;
  const left = 50 + Math.cos(angle) * 36;
  const top = 48 + Math.sin(angle) * 28;

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

function BidProgress({ bid, points }) {
  const bidCount = Number(bid);
  const completedCount = Number(points) || 0;

  if (!Number.isFinite(bidCount) || bidCount <= 0) {
    return null;
  }

  return (
    <div className="relative z-20 mt-2 flex justify-center gap-1.5">
      {Array.from({ length: bidCount }).map((_, index) => {
        const isChecked = index < completedCount;

        return (
          <input
            type="checkbox"
            checked={isChecked}
            readOnly
            key={index}
            aria-label={`Bid ${index + 1} ${isChecked ? 'feito' : 'pendente'}`}
            className={`size-4 appearance-none rounded border shadow-md shadow-black/35 ${
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
  isCurrent = false,
  isReady = false,
  lifes,
  nickname,
  position,
  points,
  readyControls = null,
  showReadyState = false,
}) {
  const scaleClass = isCurrent ? 'scale-90' : 'scale-75';
  const readyBorderClass =
    showReadyState && isReady ? 'border-emerald-400' : 'border-amber-400';
  const readyRingClass =
    showReadyState && isReady ? 'ring-emerald-400/50' : 'ring-white/10';

  return (
    <div
      className={`absolute z-10 w-[min(19.8rem,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2 ${scaleClass} sm:w-[21.6rem]`}
      style={position}
    >
      <div className="absolute left-28 top-0 z-0 flex h-16 -translate-y-7 items-start overflow-hidden pr-4">
        {[0, 1, 2, 3].map((cardIndex) => (
          <img
            key={cardIndex}
            src={cardBack}
            alt=""
            className="-ml-6 h-19 w-[3.2rem] rounded-md border-2 border-black object-cover shadow-lg shadow-black/35 first:ml-0"
            draggable="false"
          />
        ))}
      </div>

      <div className="relative z-10 flex items-center">
        <div
          className={`relative z-20 grid size-[6.6rem] shrink-0 place-items-center overflow-hidden rounded-full border-[3px] ${readyBorderClass} bg-black shadow-2xl shadow-black/60 sm:size-[7.7rem]`}
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
          className={`-ml-5 flex min-h-20 flex-1 items-center justify-between gap-3 rounded-[2rem] bg-zinc-900/95 py-4 pl-9 pr-4 text-white shadow-2xl shadow-black/55 ring-1 ${readyRingClass} backdrop-blur-sm sm:min-h-24 sm:pl-11`}
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

export function Game() {
  const { lobbyId } = useParams();
  const location = useLocation();
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
  const [hasGameSocket, setHasGameSocket] = useState(false);
  const [isReadySending, setIsReadySending] = useState(false);
  const [matchPhase, setMatchPhase] = useState('waiting');

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
  const isWaitingForReady = matchPhase === 'waiting';
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
    setJoinError('');
    setHasGameSocket(false);
    setIsReadySending(false);
    setMatchPhase('waiting');

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

    const handleServerMessage = (message) => {
      if (!isCurrent) {
        return;
      }

      switch (message.type) {
        case 'Snapshot': {
          if (message.data?.type === 'Waiting') {
            setMatchPhase('waiting');
          }

          if (message.data?.type === 'Playing') {
            setIsReadySending(false);
            setMatchPhase('playing');
          }

          const statusMap = getSnapshotStatusMap(message.data);
          const gameInfo = getGameInfoFromSnapshot(message.data);

          if (statusMap) {
            applyStatusMap(statusMap, gameInfo);
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
          setMatchPhase('playing');
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
              },
            };
          });
          break;
        case 'RoundEnded':
          setMatchPhase('playing');
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
        case 'PlayerDeck':
        case 'PlayerTurn':
        case 'TurnPlayed':
          setIsReadySending(false);
          setMatchPhase('playing');
          break;
        case 'SetStart':
          setIsReadySending(false);
          setMatchPhase('playing');
          setPlayersById((previousPlayers) => {
            return Object.entries(previousPlayers).reduce(
              (nextPlayers, [playerId, player]) => {
                nextPlayers[playerId] = {
                  ...player,
                  bid: null,
                  points: 0,
                };

                return nextPlayers;
              },
              {},
            );
          });
          break;
        case 'SetEnded':
          setMatchPhase('playing');
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
          setMatchPhase('ended');
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
          setMatchPhase('playing');
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

  return (
    <main
      aria-label="Oh Hell game table"
      className="relative min-h-screen overflow-hidden bg-black"
    >
      <div
        className="absolute left-1/2 top-1/2 h-screen w-[130vh] -translate-x-1/2 -translate-y-1/2 rotate-90 scale-80 bg-cover bg-center bg-no-repeat sm:h-full sm:w-full sm:rotate-0 sm:scale-100"
        style={{ backgroundImage: `url(${tableBackground})` }}
      />

      {tablePlayers.map((player, index) => (
        <PlayerSeat
          key={player.id}
          avatarSrc={player.avatarSrc}
          bid={player.bid}
          isCurrent={player.id === resolvedCurrentPlayerId}
          isReady={player.ready}
          lifes={player.lifes ?? lifes}
          nickname={player.nickname}
          position={getSeatPosition(index, tablePlayers.length)}
          points={player.points}
          readyControls={
            isWaitingForReady && player.id === resolvedCurrentPlayerId ? (
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
      ))}

      {joinError ? (
        <div className="absolute left-1/2 top-6 z-20 w-[min(22rem,calc(100vw-2rem))] -translate-x-1/2 rounded-lg border border-destructive/50 bg-background/90 px-4 py-3 text-center text-sm text-destructive shadow-lg backdrop-blur">
          {joinError}
        </div>
      ) : null}
    </main>
  );
}
