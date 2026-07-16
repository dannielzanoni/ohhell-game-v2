import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GalleryHorizontalEnd, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import tableBackground from '@/games/classic/assets/table-background.png';
import {
  getClassicCardBackSrc as getCardBackSrc,
  getClassicCardImageSrc as getCardImageSrc,
  getClassicCardKey as getCardKey,
} from '@/games/classic/assets/cardAssetRegistry.js';
import {
  CLASSIC_TURN_DELAY_BASE_SECONDS,
  CLASSIC_TURN_DELAY_MULTIPLIER,
  MAX_CLASSIC_ACTION_LOGS,
} from '@/games/classic/config/classicSessionConfig.js';
import {
  getClassicPlayableCards as getPlayableCards,
  getClassicCardStrength as getCardStrength,
  getStrongestClassicTurn as getStrongestTurn,
  removeClassicCardFromDeck as removeCardFromDeck,
} from '@/games/classic/model/cardRules.js';
import { getClassicCardLabel as getCardLabel } from '@/games/classic/presentation/cardLabels.js';
import { ClassicTableInfo } from '@/games/classic/components/session/ClassicTableInfo.jsx';
import bidIcon from '@/shared/assets/icons/bid.svg';
import healthIcon from '@/games/hell-hand/assets/icons/heart_2.svg';
import {
  POWER_TURN_DELAY_BASE_SECONDS,
  TURN_DELAY_CARD_SECONDS,
  TURN_DELAY_POWER_CARD_SECONDS,
} from '@/games/hell-hand/config/hellHandSessionConfig.js';
import { Button } from '@/shared/ui/button.jsx';
import { useToast } from '@/features/notifications/ToastProvider.jsx';
import { getAuthToken } from '@/shared/api/apiClient.js';
import { isMissingAuthTokenError, refreshAuthIfNeeded } from '@/features/auth/api/authService.js';
import {
  createGameSocket,
  isWaitingLobbyInactiveClose,
  playTurn,
  putBid,
  selectMercenary,
  setPlayerReady,
  skipPowerPhase,
  usePowerCard as sendPowerCard,
} from '@/games/core/api/gameSocket.js';
import { WS_RECONNECT_DELAYS_MS } from '@/games/core/api/reconnectPolicy.js';
import { getPowerDecks } from '@/games/hell-hand/api/powerDecks.js';
import {
  deckTypes,
  getGamePreferences,
  subscribeToGamePreferences,
} from '@/features/settings/model/gamePreferences.js';
import { GAME_TYPES } from '@/games/core/model/gameTypes.js';
import { cn } from '@/shared/lib/utils.js';
import { getGameVisualConfig } from '@/games/core/config/gameVisualConfig.js';
import { stopHellHandHomeTheme } from '@/games/hell-hand/services/audio.js';
import { getLobbies, joinLobby } from '@/games/core/api/lobby.js';
import { getMercenaries } from '@/games/hell-hand/api/mercenaries.js';
import { removePowerCardFromHand } from '@/games/hell-hand/model/powerCardRules.js';
import {
  findMercenary,
  mercenaries as localMercenaries,
  normalizeRemoteMercenaries,
} from '@/games/hell-hand/mercenaries/mercenaries.js';
import {
  getSeatPosition,
  LIFE_LOSS_HIGHLIGHT_DURATION_MS,
  MAX_DISPLAYED_LIFES,
  MAX_TABLE_PLAYERS,
  MAX_VISIBLE_SEAT_CARDS,
  PILE_WEAK_CARD_DELAY_MS,
  PLAYER_ACCENT_COLORS,
  ROUND_END_DELAY_MS,
} from '@/games/session/config/tablePresentation.js';
import { useGameSounds } from '@/games/session/sounds/useGameSounds.js';
import {
  GameEndedOverlay,
  LifeLossPopup,
  PlayedCardAnimation,
} from '@/games/session/animations/SessionAnimations.jsx';
import {
  getAddedTurn,
  getTurnAnimationKey as getTurnKey,
} from '@/games/session/animations/animationFlow.js';
import {
  HellHandMercenaryJoinGate,
  ManaPool,
  PowerCardHand,
  WaitingPowerLobbyInfo,
} from '@/games/hell-hand/components/session/HellHandSessionComponents.jsx';
import {
  getGamePile,
  getInitialSetCardCount,
  getPlayedCountsByPlayer,
  getRandomItem,
  getSeatCardCount,
  hasPositiveLifes,
  orderPlayersClockwise,
} from '@/games/session/flow/gameFlow.js';
import {
  getGameInfoFromSnapshot,
  getKnownLobbyGameType,
  getLobbyCharacterId,
  getLobbyGameInfo,
  getLobbyGameType,
  getLobbyLifeMultiplier,
  getLobbyLifes,
  getLobbyPowerDeckId,
  getLobbyStatusMap,
  getLobbySummaryGameType,
  getSnapshotStatusMap,
  getWaitingLobbySettings,
} from '@/games/session/flow/lobbyFlow.js';
import {
  applyGameInfo,
  createFallbackPlayer,
  createGameEndSummary,
  createLifeLossHighlight,
  getClaimsPlayerId,
  getCurrentPlayerId,
  getLocalPlayerIdCandidates,
  getPlayerLogName,
  mergeLifesIntoPlayers,
  normalizePlayer,
  normalizeStatusMap,
  resolveCurrentPlayerId,
} from '@/games/session/flow/playerFlow.js';
import {
  ActionTimer,
  BidControls,
  ReadyControls,
  ReadyStatusBadge,
  RoomLinkCopy,
} from '@/games/session/flow/SessionFlowControls.jsx';
import { LobbyAuthGate } from '@/games/session/flow/LobbyAuthGate.jsx';
import { getTimerSnapshot, useTimerNow } from '@/games/session/flow/timerFlow.js';

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
  const bidCount = Number.isFinite(numericBid) ? Math.max(0, Math.trunc(numericBid)) : 0;
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
              isChecked ? 'border-emerald-300 bg-emerald-400' : 'border-white/30 bg-black/75'
            }`}
          />
        );
      })}
    </div>
  );
}

function PlayerSeat({
  accentColor = '',
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
  maxLifes = MAX_DISPLAYED_LIFES,
  mana,
  mercenaryIconSrc = '',
  nickname,
  onPowerCardDrop = null,
  position,
  points,
  readyControls = null,
  showReadyState = false,
  turnTimer = null,
  visualScale = 1,
}) {
  const isPowerDropActive = canDropPowerCard && draggingPowerCard?.type === 'targetable';
  const timerNow = useTimerNow(turnTimer);
  const timerProgress = getTimerSnapshot(turnTimer, timerNow).progress;
  const showTurnTimer = Boolean(isTurnToPlay && turnTimer);
  const numericLifes = Math.max(0, Number(lifes) || 0);
  const numericMaxLifes = Math.max(1, Number(maxLifes) || MAX_DISPLAYED_LIFES);
  const healthPercent = Math.min(100, Math.round((numericLifes / numericMaxLifes) * 100));
  const playerIconSrc = mercenaryIconSrc || avatarSrc;
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
      className="absolute z-10 w-[min(19.8rem,calc(100vw-1.5rem))] sm:w-[21.6rem]"
      style={{
        ...position,
        transform: `translate(-50%, -50%) scale(${(isCurrent ? 0.9 : 0.75) * visualScale})`,
      }}
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
            className={`ohhell-health-progress relative grid size-full place-items-center overflow-hidden rounded-full border-[3px] ${avatarBorderClass} bg-zinc-950 shadow-2xl shadow-black/60`}
            data-value={healthPercent}
            role="progressbar"
            aria-label={`${nickname}: ${numericLifes} de ${numericMaxLifes} de vida`}
            aria-valuemin={0}
            aria-valuemax={numericMaxLifes}
            aria-valuenow={numericLifes}
            style={{
              '--health-progress': healthPercent,
              borderColor: accentColor || undefined,
            }}
          >
            <div className="ohhell-health-progress__inner" aria-hidden="true">
              <span className="ohhell-health-progress__wave" />
              <span className="ohhell-health-progress__wave ohhell-health-progress__wave--secondary" />
            </div>
          </div>

          <div
            className="absolute -bottom-1 left-[-0.9rem] z-30 grid size-[3.96rem] place-items-center overflow-hidden rounded-full border-2 border-amber-300/80 bg-black shadow-lg shadow-black/70 sm:left-[-0.93rem] sm:size-[4.32rem]"
            style={{ borderColor: accentColor || undefined }}
          >
            {playerIconSrc ? (
              <img
                src={playerIconSrc}
                alt=""
                className="size-full object-cover"
                draggable="false"
              />
            ) : (
              <UserRound className="size-6 text-zinc-300" />
            )}
          </div>
          <span
            className="absolute -bottom-1 left-12 z-30 inline-flex items-center justify-center gap-1.5 rounded-full border border-red-200/25 bg-zinc-950/95 px-[1.375rem] py-2 text-[0.94rem] font-black leading-none text-red-50 shadow-lg shadow-black/60 sm:left-[3.35rem] sm:text-[1.07rem]"
            aria-label={`${numericLifes} de ${numericMaxLifes} de vida`}
          >
            <img src={healthIcon} alt="" className="size-4 object-contain" draggable="false" />
            {numericLifes}/{numericMaxLifes}
          </span>
        </div>

        <div className="-ml-5 flex min-h-20 flex-1 items-center justify-between gap-3 rounded-[2rem] bg-zinc-900/95 py-4 pl-9 pr-4 text-white shadow-2xl shadow-black/55 ring-1 ring-white/10 backdrop-blur-sm sm:min-h-24 sm:pl-11">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-5 sm:text-base">{nickname}</p>
            <ManaPool mana={mana} />
            <BidProgress bid={bid} points={points} />
          </div>

          <div
            aria-label="Bid escolhido"
            className="flex h-11 min-w-11 shrink-0 items-center justify-center gap-1 rounded-2xl border border-white/10 bg-black/45 px-3 text-[1.2rem] font-bold text-white shadow-inner shadow-black/40 sm:h-12 sm:min-w-12"
          >
            {bid ?? '-'}
            <img src={bidIcon} alt="" className="size-4 object-contain" draggable="false" />
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
  playerColorsById = {},
  playersById,
  upcard,
  visualOffsetX = 0,
  visualOffsetY = 0,
  visualScale = 1,
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
    <div
      className="absolute left-1/2 top-1/2 z-0 flex w-[min(35rem,calc(100vw-2rem))] items-center justify-center gap-5 p-4 text-white sm:gap-8"
      style={{
        transform: `translate(calc(-50% + ${visualOffsetX}%), calc(-50% + ${visualOffsetY}%)) scale(${visualScale})`,
      }}
    >
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
          {visualPile.length
            ? visualPile.map(({ index: turnIndex, isElevated, turn }, index) => {
                const turnPlayer = playersById[turn.player_id];
                const playerName = turnPlayer?.nickname || turn.player_id;

                return (
                  <div
                    key={`${getTurnKey(turn)}:${turnIndex}`}
                    title={`${playerName}: ${getCardLabel(turn.card)}`}
                    className={`absolute left-1/2 top-1/2 ${pileCardSizeClass} -translate-x-1/2 -translate-y-1/2 transition-transform duration-500 ease-out`}
                    style={{
                      transform: `translate(-50%, -50%) translateX(${index * 22}px) rotate(${index * 5 - 8}deg)`,
                      zIndex: isElevated ? visualPile.length + 10 : index + 1,
                    }}
                  >
                    <img
                      src={getCardImageSrc(turn.card, deckType, cardBackSrc)}
                      alt={`${playerName}: ${getCardLabel(turn.card)}`}
                      className="size-full rounded-lg border-2 border-black bg-white object-contain shadow-xl shadow-black/60"
                      draggable="false"
                    />
                    <span
                      aria-label={playerName}
                      className="absolute -bottom-1 -left-1 z-10 grid size-7 place-items-center overflow-hidden rounded-full border-2 bg-black shadow-lg shadow-black/70 sm:size-8"
                      style={{
                        borderColor: playerColorsById[turn.player_id] || PLAYER_ACCENT_COLORS[2],
                      }}
                    >
                      {turnPlayer?.avatarSrc ? (
                        <img
                          src={turnPlayer.avatarSrc}
                          alt=""
                          className="size-full object-cover"
                          draggable="false"
                        />
                      ) : (
                        <UserRound className="size-4 text-white" />
                      )}
                    </span>
                  </div>
                );
              })
            : null}
        </div>
      </div>
    </div>
  );
}

function PlayerHand({
  canPlayCards,
  cardBackSrc,
  cards,
  centered = false,
  deckType,
  onPlayCard,
  visualOffsetX = 0,
  visualOffsetY = 0,
  visualScale = 1,
  visualContainerHeightVh = 0,
  visualContainerWidthVw = 0,
  visualContainerOffsetX = 0,
  visualContainerOffsetY = 0,
}) {
  const [isCompact, setIsCompact] = useState(false);
  const [manualCards, setManualCards] = useState(() => cards);
  const draggedCardIndexRef = useRef(null);
  const droppedInsideRef = useRef(false);
  const cardsSignature = cards.map(getCardKey).sort().join('|');

  useEffect(() => {
    setManualCards(cards);
  }, [cards, cardsSignature]);

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
  const compactOverlapClass = isFrenchDeck
    ? 'ml-[-3.18rem] sm:ml-[-3.38rem]'
    : 'ml-[-3.41rem] sm:ml-[-3.63rem]';
  const orderedCards = manualCards;

  const reorderCard = (targetIndex) => {
    const sourceIndex = draggedCardIndexRef.current;
    if (sourceIndex === null) return;
    droppedInsideRef.current = true;
    if (sourceIndex === targetIndex) return;
    setManualCards((currentCards) => {
      const nextCards = [...currentCards];
      const [movedCard] = nextCards.splice(sourceIndex, 1);
      nextCards.splice(targetIndex, 0, movedCard);
      return nextCards;
    });
  };

  return (
    <div
      className={`absolute bottom-0 z-40 flex h-[13.5rem] items-end overflow-x-auto overflow-y-hidden rounded-lg border border-white/10 bg-black/60 px-3 pb-3 pt-12 shadow-2xl shadow-black/45 backdrop-blur-sm sm:h-[14.85rem] ${centered ? 'left-1/2 w-[min(92vw,82rem)] -translate-x-1/2' : 'left-3 w-[calc(50%-0.75rem)]'}`}
      style={{
        height: visualContainerHeightVh ? `${visualContainerHeightVh}vh` : undefined,
        width: centered && visualContainerWidthVw ? `${visualContainerWidthVw}vw` : undefined,
        transform:
          centered && (visualContainerOffsetX || visualContainerOffsetY)
            ? `translate(calc(-50% + ${visualContainerOffsetX}%), ${visualContainerOffsetY}%)`
            : undefined,
      }}
      onDragOver={(event) => {
        if (draggedCardIndexRef.current === null) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(event) => {
        event.preventDefault();
        reorderCard(orderedCards.length - 1);
      }}
    >
      <div className="pointer-events-auto absolute right-3 top-3 z-[100] flex items-center gap-2">
        <Button
          type="button"
          size="icon-sm"
          className="size-11 [&_svg]:size-5"
          variant={isCompact ? 'default' : 'outline'}
          title={isCompact ? 'Desativar sobreposição' : 'Sobrepor cartas em 50%'}
          aria-pressed={isCompact}
          aria-label="Alternar sobreposição das cartas"
          onClick={() => setIsCompact((current) => !current)}
        >
          <GalleryHorizontalEnd />
        </Button>
      </div>
      <div
        className={`flex min-w-full w-max items-end gap-0 pr-4 ${centered ? 'justify-center' : 'justify-start'}`}
        dir="rtl"
        style={{
          scale: visualScale,
          transform: `translate(${visualOffsetX}%, ${visualOffsetY}%)`,
          transformOrigin: 'right bottom',
        }}
      >
        {orderedCards.map((card, index) => (
          <button
            key={`${getCardKey(card)}-${index}`}
            dir="ltr"
            type="button"
            disabled={!canPlayCards}
            draggable={canPlayCards}
            title={getCardLabel(card)}
            className={`relative shrink-0 hover:!z-[150] ${index === 0 ? '' : isCompact ? compactOverlapClass : overlapClass} ${
              canPlayCards
                ? 'cursor-pointer active:-translate-y-3 sm:hover:-translate-y-6 sm:hover:scale-125'
                : 'cursor-not-allowed opacity-98'
            } transition duration-200`}
            style={{ zIndex: orderedCards.length - index }}
            onDragStart={(event) => {
              draggedCardIndexRef.current = index;
              droppedInsideRef.current = false;
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData('text/plain', getCardKey(card));
            }}
            onDragOver={(event) => {
              if (draggedCardIndexRef.current === null) return;
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              reorderCard(index);
            }}
            onDragEnd={() => {
              if (!droppedInsideRef.current) onPlayCard(card);
              draggedCardIndexRef.current = null;
              droppedInsideRef.current = false;
            }}
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

export { BidControls, PlayerHand, PlayerSeat, TableCenter, ActionTimer };

export function GameSessionPage({
  createGamePath = '/classic/create-game',
  initialGameType = GAME_TYPES.CLASSIC,
  roomsPath = '/classic/rooms',
}) {
  const { lobbyId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const gamePreferencesRef = useRef(getGamePreferences());
  const translateRef = useRef(t);
  const actionTimerRef = useRef(null);
  const actionTimerExpireHandlerRef = useRef(null);
  const actionLogSequenceRef = useRef(0);
  const localPlayerIdsRef = useRef([]);
  const playerDeckCountRef = useRef(0);
  const powerCardCountRef = useRef(0);
  const pileElevationTimeoutRef = useRef(null);
  const pileRef = useRef([]);
  const lifeLossHighlightTimeoutRef = useRef(null);
  const lastCompletedPileRef = useRef([]);
  const queuedRoundEndMessagesRef = useRef([]);
  const roundCardCountRef = useRef(0);
  const tableBidRef = useRef(0);
  const roundPointsRef = useRef({});
  const profileCardRef = useRef(null);
  const roundEndDelayTimeoutRef = useRef(null);
  const roundEndDelayActiveRef = useRef(false);
  const turnPromptSoundRef = useRef('');
  const socketRef = useRef(null);
  const upcardRef = useRef(null);
  const [authGateError, setAuthGateError] = useState('');
  const [authGateOpen, setAuthGateOpen] = useState(() => !getAuthToken());
  const [actionTimer, setActionTimer] = useState(null);
  const [classicActionLogs, setClassicActionLogs] = useState([]);
  const [classicInfoOpen, setClassicInfoOpen] = useState(false);
  const [visualViewport, setVisualViewport] = useState(() => ({
    isLandscape: window.innerWidth > window.innerHeight,
    isMobile: Math.min(window.innerWidth, window.innerHeight) < 640,
  }));
  const officialVisualConfig = getGameVisualConfig(visualViewport);
  useEffect(() => {
    const updateVisualViewport = () => {
      setVisualViewport({
        isLandscape: window.innerWidth > window.innerHeight,
        isMobile: Math.min(window.innerWidth, window.innerHeight) < 640,
      });
    };

    window.addEventListener('resize', updateVisualViewport);
    return () => window.removeEventListener('resize', updateVisualViewport);
  }, []);
  const [gamePreferences, setGamePreferencesState] = useState(() => gamePreferencesRef.current);
  const [isProfileConfirming, setIsProfileConfirming] = useState(false);
  const [profileGateState, setProfileGateState] = useState({
    canSaveProfile: false,
    hasAuthToken: Boolean(getAuthToken()),
    isSaving: false,
    saveError: '',
  });
  const [joinAttempt, setJoinAttempt] = useState(0);
  const [currentPlayerId, setCurrentPlayerId] = useState(() => getCurrentPlayerId());
  const [lifes, setLifes] = useState(() => getLobbyLifes(lobbyId, location.state?.lifes));
  const [waitingLifeMultiplier, setWaitingLifeMultiplier] = useState(() =>
    getLobbyLifeMultiplier(lobbyId, location.state?.lifeMultiplier),
  );
  const [waitingPowerDeckId, setWaitingPowerDeckId] = useState(() =>
    getLobbyPowerDeckId(lobbyId, location.state?.powerDeckId),
  );
  const [waitingPowerDeckMeta, setWaitingPowerDeckMeta] = useState(null);
  const [gameType, setGameType] = useState(() =>
    getLobbyGameType(lobbyId, location.state?.gameType || initialGameType),
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
      [playerId]: createFallbackPlayer(playerId, getLobbyLifes(lobbyId, location.state?.lifes)),
    };
  });
  const [playerOrder, setPlayerOrder] = useState(() => Object.keys(playersById));
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
  const [tableBid, setTableBid] = useState(0);
  const [turnPlayerId, setTurnPlayerId] = useState(null);
  const [upcard, setUpcard] = useState(null);
  const returnToRoomsPath = location.state?.returnToRooms || roomsPath;

  const updateTableBid = useCallback((nextCount) => {
    const normalizedCount = Math.max(0, Number(nextCount) || 0);
    tableBidRef.current = normalizedCount;
    setTableBid(normalizedCount);
  }, []);

  const appendClassicActionLog = useCallback((entry) => {
    actionLogSequenceRef.current += 1;
    const nextEntry = {
      ...entry,
      id: `${Date.now()}-${actionLogSequenceRef.current}`,
    };

    setClassicActionLogs((currentLogs) =>
      [...currentLogs, nextEntry].slice(-MAX_CLASSIC_ACTION_LOGS),
    );
  }, []);

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

    return orderPlayersClockwise(visiblePlayers, playerOrder, resolvedCurrentPlayerId).slice(
      0,
      MAX_TABLE_PLAYERS,
    );
  }, [lifes, matchPhase, playerOrder, playersById, resolvedCurrentPlayerId]);

  const playerColorsById = useMemo(() => {
    const orderedPlayerIds = Array.from(new Set([...playerOrder, ...Object.keys(playersById)]));
    return Object.fromEntries(
      orderedPlayerIds.map((playerId, index) => [
        playerId,
        PLAYER_ACCENT_COLORS[index % PLAYER_ACCENT_COLORS.length],
      ]),
    );
  }, [playerOrder, playersById]);

  const bidSum = useMemo(
    () =>
      tablePlayers.reduce((total, player) => {
        const bid = Number(player.bid);
        return total + (Number.isFinite(bid) ? bid : 0);
      }, 0),
    [tablePlayers],
  );

  const readyCount = tablePlayers.filter((player) => player.ready).length;
  const totalPlayers = tablePlayers.length;
  const currentPlayer = resolvedCurrentPlayerId ? playersById[resolvedCurrentPlayerId] : null;
  const localPlayerIds = useMemo(() => {
    return Array.from(
      new Set([currentPlayerId, resolvedCurrentPlayerId, currentPlayer?.id].filter(Boolean)),
    );
  }, [currentPlayerId, currentPlayer?.id, resolvedCurrentPlayerId]);

  localPlayerIdsRef.current = localPlayerIds;

  useEffect(() => {
    playersByIdRef.current = playersById;
  }, [playersById]);

  useEffect(() => {
    actionLogSequenceRef.current = 0;
    roundPointsRef.current = {};
    setClassicActionLogs([]);
    setClassicInfoOpen(false);
  }, [lobbyId]);

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
      setJoinMercenaries(normalizeRemoteMercenaries(Array.isArray(response) ? response : []));
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
    stopHellHandHomeTheme();
  }, [lobbyId]);

  useEffect(() => {
    if (!lobbyId || !gameType) return;
    window.dispatchEvent(
      new CustomEvent('ohhell:lobby-game-type', {
        detail: { gameType, lobbyId },
      }),
    );
  }, [gameType, lobbyId]);

  useEffect(() => {
    if (gameType !== GAME_TYPES.HELL_HAND || !waitingPowerDeckId || matchPhase !== 'waiting') {
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

  const playedCountsByPlayer = useMemo(() => getPlayedCountsByPlayer(pile), [pile]);
  const isWaitingForReady = matchPhase === 'waiting';
  const isCurrentPlayerTurn = Boolean(
    currentPlayer?.turnToPlay || (turnPlayerId && localPlayerIds.includes(turnPlayerId)),
  );
  const isCurrentPowerTurn = Boolean(
    gameType === GAME_TYPES.HELL_HAND &&
    gameStage === 'power' &&
    hasGameSocket &&
    isCurrentPlayerTurn,
  );
  const canPlayCards = Boolean(
    gameStage === 'dealing' && hasGameSocket && isCurrentPlayerTurn && playerDeck.length,
  );
  const canUsePowerCards = Boolean(isCurrentPowerTurn && powerCards.length);
  const canSkipPowerPhase = isCurrentPowerTurn;
  const hasEnoughPlayers = totalPlayers > 1;
  const needsMercenarySelection = Boolean(
    gameType === GAME_TYPES.HELL_HAND && !currentPlayer?.mercenaryId && !selectedMercenaryId,
  );
  const canToggleReady = Boolean(
    hasGameSocket &&
    isWaitingForReady &&
    hasEnoughPlayers &&
    !needsMercenarySelection &&
    !isReadySending,
  );

  const { clearTurnPromptSound, playCardAnimationSound, playTurnPromptSound } = useGameSounds({
    gamePreferencesRef,
    turnPromptSoundRef,
  });

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
    const highlight = createLifeLossHighlight(lifesByPlayer, playersByIdRef.current, defaultLifes);

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
    navigate(createGamePath);
  }, [createGamePath, navigate]);

  const startActionTimer = useCallback(
    (type, cardCount, actionGameType = GAME_TYPES.CLASSIC, powerCardCount = 0) => {
      const normalizedCardCount = Math.max(0, Math.trunc(Number(cardCount) || 0));
      const normalizedPowerCardCount =
        actionGameType === GAME_TYPES.HELL_HAND
          ? Math.max(0, Math.trunc(Number(powerCardCount) || 0))
          : 0;
      const baseSeconds =
        actionGameType === GAME_TYPES.HELL_HAND
          ? POWER_TURN_DELAY_BASE_SECONDS
          : CLASSIC_TURN_DELAY_BASE_SECONDS;
      const durationMs =
        actionGameType === GAME_TYPES.CLASSIC
          ? (baseSeconds + normalizedCardCount) * CLASSIC_TURN_DELAY_MULTIPLIER * 1000
          : (baseSeconds +
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
        setElevatedPileCardKey((currentKey) => (currentKey === turnKey ? '' : currentKey));
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

      if (lobbyId && gameType) {
        window.dispatchEvent(
          new CustomEvent('ohhell:lobby-game-type', {
            detail: { gameType, lobbyId },
          }),
        );
      }

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
    let nextLifes = getLobbyLifes(lobbyId, location.state?.lifes);
    const knownGameType = getKnownLobbyGameType(
      lobbyId,
      location.state?.gameType || initialGameType,
    );
    let activeGameType = knownGameType || initialGameType;
    const nextLifeMultiplier = getLobbyLifeMultiplier(lobbyId, location.state?.lifeMultiplier);
    const nextPowerDeckId = getLobbyPowerDeckId(lobbyId, location.state?.powerDeckId);
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
        localStorage.setItem(`ohhell_lobby_character_${lobbyId}`, activeCharacterId);
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
    updateTableBid(0);
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
      const statusOrder = Object.entries(statusMap || {}).map(([id, status]) => {
        return getClaimsPlayerId(status?.player) || id;
      });

      if (statusOrder.length) {
        setPlayerOrder(statusOrder);
      }

      setPlayersById((previousPlayers) => {
        const normalizedPlayers = normalizeStatusMap(statusMap, nextLifes, previousPlayers);

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
          localStorage.setItem(`ohhell_lobby_game_type_${lobbyId}`, waitingSettings.game_type);
        }
      }

      const configuredLifes = Number(waitingSettings.lifes ?? waitingSettings.lives);

      if (
        activeGameType === GAME_TYPES.CLASSIC &&
        Number.isFinite(configuredLifes) &&
        configuredLifes > 0
      ) {
        nextLifes = configuredLifes;
        setLifes(configuredLifes);
        if (lobbyId) {
          localStorage.setItem(`ohhell_lobby_lifes_${lobbyId}`, String(configuredLifes));
        }
      }

      if (
        waitingSettings.game_type === GAME_TYPES.HELL_HAND &&
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
          localStorage.setItem(`ohhell_lobby_power_deck_${lobbyId}`, waitingSettings.power_deck_id);
        }
      }
    };

    const getLocalPlayerIds = (gameInfo, statusMap) => {
      return getLocalPlayerIdCandidates({
        currentPlayerId: nextCurrentPlayerId,
        gameInfo,
        localPlayerIds: localPlayerIdsRef.current,
        playersById: playersByIdRef.current,
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
      const snapshotInitialLifes = Number(gameInfo.initial_lifes);

      if (
        activeGameType === GAME_TYPES.CLASSIC &&
        Number.isFinite(snapshotInitialLifes) &&
        snapshotInitialLifes > 0
      ) {
        nextLifes = snapshotInitialLifes;
        setLifes(snapshotInitialLifes);
        if (lobbyId) {
          localStorage.setItem(`ohhell_lobby_lifes_${lobbyId}`, String(snapshotInitialLifes));
        }
      }

      setIsReadySending(false);
      setMatchPhase('playing');
      updateUpcard(gameInfo.upcard || null);
      const snapshotPile = getGamePile(gameInfo);
      if (snapshotPile) {
        updatePile(snapshotPile);
      }
      setTurnPlayerId(gameInfo.current_player || null);
      if (Array.isArray(gameInfo.info) && gameInfo.info.length) {
        setPlayerOrder(gameInfo.info.map((info) => info.id));
        roundPointsRef.current = Object.fromEntries(
          gameInfo.info.map((info) => [info.id, Number(info.rounds) || 0]),
        );
      }
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
        updateTableBid(getInitialSetCardCount(gameInfo, localPlayerIds));
      }

      const nextPowerCardCount = Array.isArray(gameInfo.power_cards)
        ? gameInfo.power_cards.length
        : powerCardCountRef.current;

      if (Array.isArray(gameInfo.power_cards)) {
        powerCardCountRef.current = nextPowerCardCount;
        setPowerCards(gameInfo.power_cards);
      }

      if (gameInfo.stage?.type === 'Bidding') {
        const snapshotPossibleBids = gameInfo.stage.data?.possible_bids || [];
        setPossibleBids(
          localPlayerIds.includes(gameInfo.current_player) ? snapshotPossibleBids : [],
        );
        startActionTimer(
          'bid',
          snapshotPossibleBids.length || getActionCardCount(),
          activeGameType,
          nextPowerCardCount,
        );
        if (localPlayerIds.includes(gameInfo.current_player)) {
          playTurnPromptSound('bid', gameInfo.current_player);
        }
      } else if (gameInfo.stage?.type === 'Power') {
        startActionTimer('power', 0, activeGameType, nextPowerCardCount);
        if (localPlayerIds.includes(gameInfo.current_player)) {
          playTurnPromptSound('bid', gameInfo.current_player);
        }
      } else if (gameInfo.stage?.type === 'Dealing') {
        startActionTimer('play', getActionCardCount(), activeGameType, nextPowerCardCount);
        if (localPlayerIds.includes(gameInfo.current_player)) {
          playTurnPromptSound('play', gameInfo.current_player);
        }
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
      lastCompletedPileRef.current = pileRef.current;
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
      roundEndDelayTimeoutRef.current = window.setTimeout(completeRoundEndDelay, delayMs);
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
          setPlayerOrder((currentOrder) => {
            const playerId = getClaimsPlayerId(message.data);
            return !playerId || currentOrder.includes(playerId)
              ? currentOrder
              : [...currentOrder, playerId];
          });
          break;
        }
        case 'PlayerLeft':
          setPlayerOrder((currentOrder) =>
            currentOrder.filter((playerId) => playerId !== message.data.player_id),
          );
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
            const existing = previousPlayers[playerId] || createFallbackPlayer(playerId, nextLifes);

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
            const existing = previousPlayers[playerId] || createFallbackPlayer(playerId, nextLifes);

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
            const existing = previousPlayers[playerId] || createFallbackPlayer(playerId, nextLifes);

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
              const existing = nextPlayers[playerId] || createFallbackPlayer(playerId, nextLifes);

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
              const existing = nextPlayers[playerId] || createFallbackPlayer(playerId, nextLifes);

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
          if (activeGameType === GAME_TYPES.CLASSIC) {
            const nextRoundPoints = message.data || {};
            const winnerIds = Object.entries(nextRoundPoints)
              .filter(([playerId, points]) => {
                return Number(points) > Number(roundPointsRef.current[playerId] || 0);
              })
              .map(([playerId]) => playerId);

            winnerIds.forEach((playerId) => {
              appendClassicActionLog({
                player: getPlayerLogName(playerId, playersByIdRef.current),
                type: 'roundWon',
              });
            });
            roundPointsRef.current = { ...nextRoundPoints };
          }
          setPlayersById((previousPlayers) => {
            const nextPlayers = { ...previousPlayers };

            Object.entries(message.data || {}).forEach(([playerId, points]) => {
              const existing = nextPlayers[playerId] || createFallbackPlayer(playerId, nextLifes);

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
          startActionTimer(
            'bid',
            (message.data.possible_bids || []).length || getActionCardCount(),
            activeGameType,
            powerCardCountRef.current,
          );
          if (isLocalPlayerId(message.data.player_id)) {
            setPossibleBids(message.data.possible_bids || []);
            playTurnPromptSound('bid', message.data.player_id);
          } else {
            setPossibleBids([]);
          }
          setPlayersById((previousPlayers) => {
            return Object.entries(previousPlayers).reduce((nextPlayers, [playerId, player]) => {
              nextPlayers[playerId] = {
                ...player,
                turnToPlay: playerId === message.data.player_id,
              };

              return nextPlayers;
            }, {});
          });
          break;
        case 'PlayerPowerTurn':
          setIsReadySending(false);
          setGameStage('power');
          setMatchPhase('playing');
          setPossibleBids([]);
          setTurnPlayerId(message.data.player_id);
          startActionTimer('power', 0, activeGameType, powerCardCountRef.current);
          if (isLocalPlayerId(message.data.player_id)) {
            playTurnPromptSound('bid', message.data.player_id);
          }
          setPlayersById((previousPlayers) => {
            return Object.entries(previousPlayers).reduce((nextPlayers, [playerId, player]) => {
              nextPlayers[playerId] = {
                ...player,
                turnToPlay: playerId === message.data.player_id,
              };

              return nextPlayers;
            }, {});
          });
          break;
        case 'PlayerDeck':
          setIsReadySending(false);
          setMatchPhase('playing');
          updatePlayerDeck(message.data || []);
          updateRoundCardCount((message.data || []).length);
          if (!tableBidRef.current && (message.data || []).length) {
            updateTableBid((message.data || []).length);
          }
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
              const nextCards = removePowerCardFromHand(currentCards, message.data.card?.id);
              powerCardCountRef.current = nextCards.length;
              return nextCards;
            });
          }

          showLifeLossHighlight(effectLifes, nextLifes);
          setPlayersById((previousPlayers) => {
            const nextPlayers = { ...previousPlayers };

            Object.entries(effectLifes).forEach(([playerId, life]) => {
              const existing = nextPlayers[playerId] || createFallbackPlayer(playerId, nextLifes);

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
          startActionTimer('play', getActionCardCount(), activeGameType, powerCardCountRef.current);
          if (isLocalPlayerId(message.data.player_id)) {
            playTurnPromptSound('play', message.data.player_id);
          }
          setPlayersById((previousPlayers) => {
            return Object.entries(previousPlayers).reduce((nextPlayers, [playerId, player]) => {
              nextPlayers[playerId] = {
                ...player,
                turnToPlay: playerId === message.data.player_id,
              };

              return nextPlayers;
            }, {});
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
            const strongestPreviousTurn = getStrongestTurn(previousPile, currentUpcard);

            updatePile(nextPile);

            if (activeGameType === GAME_TYPES.CLASSIC && addedTurn) {
              appendClassicActionLog({
                card: addedTurn.card,
                player: getPlayerLogName(addedTurn.player_id, playersByIdRef.current),
                type: 'cardPlayed',
              });
            }

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
            return Object.entries(previousPlayers).reduce((nextPlayers, [playerId, player]) => {
              nextPlayers[playerId] = {
                ...player,
                turnToPlay: false,
              };

              return nextPlayers;
            }, {});
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
          updateTableBid(0);
          setTurnPlayerId(null);
          updateUpcard(message.data.upcard);
          roundPointsRef.current = {};
          lastCompletedPileRef.current = [];
          if (activeGameType === GAME_TYPES.CLASSIC) {
            appendClassicActionLog({ type: 'setStarted' });
          }
          setPlayersById((previousPlayers) => {
            return Object.entries(previousPlayers).reduce((nextPlayers, [playerId, player]) => {
              nextPlayers[playerId] = {
                ...player,
                bid: null,
                points: 0,
                turnToPlay: false,
              };

              return nextPlayers;
            }, {});
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
          updateTableBid(0);
          if (activeGameType === GAME_TYPES.CLASSIC) {
            const finalRoundWinner = getStrongestTurn(
              lastCompletedPileRef.current,
              upcardRef.current,
            );

            if (finalRoundWinner) {
              appendClassicActionLog({
                player: getPlayerLogName(finalRoundWinner.player_id, playersByIdRef.current),
                type: 'roundWon',
              });
            }

            appendClassicActionLog({ type: 'setEnded' });
            Object.entries(message.data?.lifes || {}).forEach(([playerId, currentLifes]) => {
              const previousLifes = Number(playersByIdRef.current[playerId]?.lifes ?? currentLifes);
              const lostLifes = previousLifes - Number(currentLifes);

              if (lostLifes > 0) {
                appendClassicActionLog({
                  count: lostLifes,
                  player: getPlayerLogName(playerId, playersByIdRef.current),
                  type: 'lifesLost',
                });
              }
            });
          }
          lastCompletedPileRef.current = [];
          showLifeLossHighlight(message.data?.lifes || {}, nextLifes);
          setPlayersById((previousPlayers) => {
            const nextPlayers = { ...previousPlayers };

            Object.entries(message.data?.lifes || {}).forEach(([playerId, life]) => {
              const existing = nextPlayers[playerId] || createFallbackPlayer(playerId, nextLifes);

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
          updateTableBid(0);
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
            setGameEndSummary(createGameEndSummary(finalLifes, nextPlayers, nextLifes));
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
        queuedRoundEndMessagesRef.current = [...queuedRoundEndMessagesRef.current, message];
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
        queuedRoundEndMessagesRef.current = [...queuedRoundEndMessagesRef.current, message];
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

      const delayMs =
        WS_RECONNECT_DELAYS_MS[Math.min(reconnectAttempt, WS_RECONNECT_DELAYS_MS.length - 1)];
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

            if (activeGameType === GAME_TYPES.HELL_HAND && activeCharacterId) {
              try {
                selectMercenary(nextSocket, activeCharacterId);
              } catch {
                // The server can reject a stale mercenary selection during reconnection.
              }
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
          localStorage.setItem(`ohhell_lobby_game_type_${lobbyId}`, summaryGameType);
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
        window.dispatchEvent(
          new CustomEvent('ohhell:lobby-game-type', {
            detail: { gameType: resolvedGameType, lobbyId },
          }),
        );
      }

      if (resolvedGameType === GAME_TYPES.HELL_HAND && !activeCharacterId) {
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

        applyWaitingSettings(getWaitingLobbySettings(lobbyInfo));

        if (statusMap) {
          setMatchPhase('waiting');
          applyStatusMap(statusMap);
        }

        if (gameInfo) {
          applyGameState(gameInfo, statusMap);
          setPlayersById((previousPlayers) => applyGameInfo(previousPlayers, gameInfo, nextLifes));
        }

        void connectSocket();
      } catch (error) {
        if (isCurrent) {
          if (isMissingAuthTokenError(error) || !getAuthToken()) {
            setAuthGateOpen(true);
            setAuthGateError(translateRef.current('game.missingAuth'));
            setJoinError('');
          } else {
            setJoinError(error.message || translateRef.current('game.enterRoomError'));
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
    appendClassicActionLog,
    clearLifeLossHighlight,
    clearPileElevation,
    clearTurnPromptSound,
    elevatePileCard,
    initialGameType,
    joinAttempt,
    lobbyId,
    location.state?.lifes,
    location.state?.lifeMultiplier,
    location.state?.gameType,
    location.state?.powerDeckId,
    location.state?.returnToRooms,
    navigate,
    playTurnPromptSound,
    returnToRoomsPath,
    selectedMercenaryId,
    showToast,
    showLifeLossHighlight,
    startActionTimer,
    updateTableBid,
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
      playCardAnimationSound();
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

  const handleUsePowerCard = (card, targets = []) => {
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

    if (card.type === 'targetable' && targets.length !== 1) {
      setJoinError(t('game.powerCardTargetError'));
      return;
    }

    try {
      setJoinError('');
      clearTurnPromptSound();
      clearActionTimer();
      sendPowerCard(socketRef.current, card.id, targets);
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

    handleUsePowerCard(draggingPowerCard, [targetPlayerId]);
  };

  const handleActionTimerExpire = (expiredTimer = actionTimerRef.current) => {
    if (!expiredTimer || actionTimerRef.current?.id !== expiredTimer.id) return;

    const randomBid = expiredTimer.type === 'bid' ? getRandomItem(possibleBids) : null;

    if (randomBid !== null) {
      sendBid(randomBid);
      return;
    }

    if (isCurrentPowerTurn) {
      handleSkipPowerPhase();
      return;
    }

    if (canPlayCards) {
      const randomCard = getRandomItem(getPlayableCards(playerDeck, pileRef.current));

      if (randomCard) {
        handlePlayCard(randomCard);
        return;
      }
    }

    clearActionTimer();
  };

  actionTimerExpireHandlerRef.current = handleActionTimerExpire;

  useEffect(() => {
    if (!actionTimer) return undefined;

    const timerId = actionTimer.id;
    const remainingMs = Math.max(0, actionTimer.durationMs - (Date.now() - actionTimer.startedAt));
    const timeout = window.setTimeout(() => {
      if (actionTimerRef.current?.id !== timerId) return;
      actionTimerExpireHandlerRef.current?.(actionTimer);
    }, remainingMs + 25);

    return () => window.clearTimeout(timeout);
  }, [actionTimer]);

  return (
    <main
      aria-label={t('game.tableAria')}
      className="relative flex h-screen flex-col overflow-hidden bg-black"
    >
      <section className="relative min-h-0 flex-1 overflow-hidden">
        <div
          className={cn(
            'absolute left-1/2 top-1/2 bg-cover bg-center bg-no-repeat',
            visualViewport.isMobile && !visualViewport.isLandscape
              ? 'h-screen w-[130vh] -translate-x-1/2 -translate-y-1/2 rotate-90 scale-80'
              : 'h-full w-full -translate-x-1/2 -translate-y-1/2',
          )}
          style={{ backgroundImage: `url(${tableBackground})` }}
        />

        {gameType === GAME_TYPES.CLASSIC ? (
          <ClassicTableInfo
            bidSum={bidSum}
            logs={classicActionLogs}
            open={classicInfoOpen}
            onToggle={() => setClassicInfoOpen((current) => !current)}
            tableBid={tableBid}
            visualOffsetX={officialVisualConfig.tableInfoOffsetX || 0}
            visualOffsetY={officialVisualConfig.tableInfoOffsetY || 0}
            visualScale={
              (officialVisualConfig.tableInfoScale || 1) * (officialVisualConfig.tableScale || 1)
            }
          />
        ) : null}

        <TableCenter
          cardBackSrc={selectedCardBackSrc}
          deckType={gamePreferences.deckType}
          elevatedPileCardKey={elevatedPileCardKey}
          pile={pile}
          playerColorsById={gameType === GAME_TYPES.CLASSIC ? playerColorsById : {}}
          playersById={playersById}
          upcard={upcard}
          visualOffsetX={officialVisualConfig.centerOffsetX || 0}
          visualOffsetY={officialVisualConfig.centerOffsetY || 0}
          visualScale={
            (officialVisualConfig.centerScale || 1) * (officialVisualConfig.tableScale || 1)
          }
        />

        <ActionTimer
          timer={actionTimer}
          visualOffsetX={officialVisualConfig.timerOffsetX || 0}
          visualOffsetY={officialVisualConfig.timerOffsetY || 0}
          visualScale={
            (officialVisualConfig.timerScale || 1) * (officialVisualConfig.tableScale || 1)
          }
        />

        {isWaitingForReady && gameType === GAME_TYPES.HELL_HAND ? (
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
          const mercenary = findMercenary(player.mercenaryId, [
            ...joinMercenaries,
            ...localMercenaries,
          ]);
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
              accentColor={gameType === GAME_TYPES.CLASSIC ? playerColorsById[player.id] : ''}
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
              maxLifes={
                gameType === GAME_TYPES.HELL_HAND
                  ? mercenary?.vidaTotal || mercenary?.totalLife || lifes
                  : lifes
              }
              mana={player.mana}
              mercenaryIconSrc={gameType === GAME_TYPES.HELL_HAND ? mercenary?.icon || '' : ''}
              nickname={player.nickname}
              onPowerCardDrop={() => handlePowerCardDrop(player.id)}
              position={getSeatPosition(
                index,
                tablePlayers.length,
                isCurrentPlayer,
                officialVisualConfig.seatOrbitX || 36,
                officialVisualConfig.seatOrbitY || 28,
                officialVisualConfig.seatLift ?? 2,
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
              visualScale={
                (officialVisualConfig.seatScale || 1) * (officialVisualConfig.tableScale || 1)
              }
            />
          );
        })}

        <BidControls
          onBid={sendBid}
          possibleBids={hasGameSocket ? possibleBids : []}
          visualOffsetX={officialVisualConfig.bidControlOffsetX || 0}
          visualOffsetY={officialVisualConfig.bidControlOffsetY || 0}
          visualScale={
            (officialVisualConfig.bidControlScale || 1) * (officialVisualConfig.tableScale || 1)
          }
        />
      </section>
      <section
        className="relative h-[14.85rem] shrink-0 bg-zinc-950"
        style={
          gameType === GAME_TYPES.CLASSIC && officialVisualConfig.classicHandAreaHeightVh
            ? { height: `${officialVisualConfig.classicHandAreaHeightVh}vh` }
            : undefined
        }
      >
        <PowerCardHand
          canSkipPowerPhase={canSkipPowerPhase}
          canUsePowerCards={canUsePowerCards}
          cards={powerCards}
          onPowerCardDragEnd={() => setDraggingPowerCard(null)}
          onPowerCardDragStart={setDraggingPowerCard}
          onSkipPowerPhase={handleSkipPowerPhase}
          onUsePowerCard={handleUsePowerCard}
          visualOffsetX={officialVisualConfig.powerHandOffsetX || 0}
          visualOffsetY={officialVisualConfig.powerHandOffsetY || 0}
          visualScale={Math.max(1, Number(officialVisualConfig.powerHandScale) || 1) * 1.3}
        />
        <PlayerHand
          canPlayCards={canPlayCards}
          cardBackSrc={selectedCardBackSrc}
          cards={playerDeck}
          centered={gameType === GAME_TYPES.CLASSIC}
          deckType={gamePreferences.deckType}
          onPlayCard={handlePlayCard}
          visualContainerHeightVh={officialVisualConfig.classicHandAreaHeightVh || 0}
          visualContainerWidthVw={officialVisualConfig.classicHandBoxWidthVw || 0}
          visualContainerOffsetX={officialVisualConfig.classicHandBoxOffsetX || 0}
          visualContainerOffsetY={officialVisualConfig.classicHandBoxOffsetY || 0}
          visualOffsetX={officialVisualConfig.classicHandOffsetX || 0}
          visualOffsetY={officialVisualConfig.classicHandOffsetY ?? 0}
          visualScale={
            (officialVisualConfig.classicHandScale || 1) * (officialVisualConfig.tableScale || 1)
          }
        />
      </section>
      <PlayedCardAnimation
        key={playedCardAnimation?.id}
        card={playedCardAnimation?.card}
        cardBackSrc={selectedCardBackSrc}
        deckType={gamePreferences.deckType}
        onAnimationEnd={() => setPlayedCardAnimation(null)}
      />
      <LifeLossPopup highlight={lifeLossHighlight} />
      <GameEndedOverlay onBackToMenu={handleBackToMenu} summary={gameEndSummary} />

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
        canContinue={Boolean(lobbyId) && !isProfileConfirming && !profileGateState.isSaving}
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
