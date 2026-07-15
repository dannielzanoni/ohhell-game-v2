import { useEffect, useMemo, useState } from 'react';
import { Layers3 } from 'lucide-react';
import cardBack from '@/games/classic/assets/cards/backs/back_card.png';
import gameTableBackground from '@/games/classic/assets/backgrounds/game-table-bg.png';
import { deckTypes } from '@/features/settings/model/gamePreferences.js';
import {
  ActionTimer,
  BidControls,
  ClassicTableInfo,
  PlayedCardAnimation,
  PlayerHand,
  PlayerSeat,
  TableCenter,
} from '@/games/session/GameSessionPage.jsx';
import { getSeatPosition, PLAYER_ACCENT_COLORS } from '@/games/session/config/tablePresentation.js';

function DeckMarker({ count }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/65 px-3 py-2 text-white shadow-xl backdrop-blur">
      <div className="relative grid size-8 place-items-center">
        <img
          src={cardBack}
          alt=""
          className="absolute size-7 rounded border border-black object-cover opacity-70"
          draggable="false"
        />
        <Layers3 className="relative z-10 size-4 text-amber-200" />
      </div>
      <div>
        <span className="block text-[0.58rem] font-black uppercase tracking-[0.16em] text-zinc-400">
          Deck clássico
        </span>
        <strong className="block text-sm text-white">{count}</strong>
      </div>
    </div>
  );
}

export function ClassicTableView({
  animationCard,
  animationDuration,
  onAnimationEnd,
  onBid,
  onClassicPlay,
  pile,
  players,
  selectedPlayerId,
  showGuides = false,
  upcard,
  visualConfig,
}) {
  const [isMobilePortrait, setIsMobilePortrait] = useState(
    () =>
      Math.min(window.innerWidth, window.innerHeight) < 640 &&
      window.innerHeight >= window.innerWidth,
  );
  const currentPlayer = players.find((player) => player.id === selectedPlayerId) || players[0];
  const playerMap = useMemo(
    () => Object.fromEntries(players.map((player) => [player.id, player])),
    [players],
  );
  const currentIndex = Math.max(
    0,
    players.findIndex((player) => player.id === currentPlayer?.id),
  );
  const orderedPlayers = [...players.slice(currentIndex), ...players.slice(0, currentIndex)];
  const playerColorsById = useMemo(
    () =>
      Object.fromEntries(
        players.map((player, index) => [
          player.id,
          PLAYER_ACCENT_COLORS[index % PLAYER_ACCENT_COLORS.length],
        ]),
      ),
    [players],
  );
  const bidSum = players.reduce((total, player) => total + (Number(player.bid) || 0), 0);
  const tableScale = visualConfig.tableScale || 1;
  const infoLogs = [{ id: 'preview', type: 'bid', playerName: 'Você', bid: 2 }];
  const previewTimer = {
    id: 'classic-preview',
    type: 'cards',
    startedAt: Date.now(),
    durationMs: 60_000,
  };

  useEffect(() => {
    const updateOrientation = () =>
      setIsMobilePortrait(
        Math.min(window.innerWidth, window.innerHeight) < 640 &&
          window.innerHeight >= window.innerWidth,
      );
    window.addEventListener('resize', updateOrientation);
    return () => window.removeEventListener('resize', updateOrientation);
  }, []);

  return (
    <div className="relative flex min-h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-[1.75rem] border border-amber-200/15 bg-black shadow-2xl shadow-black/35">
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <div
          className={`absolute left-1/2 top-1/2 bg-cover bg-center bg-no-repeat ${isMobilePortrait ? 'h-screen w-[130vh] -translate-x-1/2 -translate-y-1/2 rotate-90 scale-80' : 'h-full w-full -translate-x-1/2 -translate-y-1/2'}`}
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, .2), rgba(0, 0, 0, .35)), url(${gameTableBackground})`,
          }}
        />
        <div className="absolute left-4 top-4 z-40">
          <DeckMarker count={pile.length} />
        </div>
        {showGuides ? (
          <div className="pointer-events-none absolute inset-[10%] z-20 rounded-full border border-dashed border-amber-200/25" />
        ) : null}
        <ClassicTableInfo
          bidSum={bidSum}
          logs={infoLogs}
          open={false}
          onToggle={() => {}}
          tableBid={currentPlayer?.classicHand?.length || 0}
          visualOffsetX={visualConfig.tableInfoOffsetX || 0}
          visualOffsetY={visualConfig.tableInfoOffsetY || 0}
          visualScale={(visualConfig.tableInfoScale || 1) * tableScale}
        />
        <ActionTimer
          timer={previewTimer}
          onExpire={() => {}}
          visualOffsetX={visualConfig.timerOffsetX || 0}
          visualOffsetY={visualConfig.timerOffsetY || 0}
          visualScale={(visualConfig.timerScale || 1) * tableScale}
        />
        <TableCenter
          cardBackSrc={cardBack}
          deckType={deckTypes.SPANISH_8BIT}
          elevatedPileCardKey=""
          pile={pile}
          playerColorsById={playerColorsById}
          playersById={playerMap}
          upcard={upcard}
          visualOffsetX={visualConfig.centerOffsetX || 0}
          visualOffsetY={visualConfig.centerOffsetY || 0}
          visualScale={(visualConfig.centerScale || 1) * tableScale}
        />
        {orderedPlayers.map((player, index) => (
          <PlayerSeat
            key={player.id}
            accentColor={playerColorsById[player.id]}
            avatarSrc={player.avatarSrc}
            cardBackSrc={cardBack}
            bid={player.bid}
            cardCount={(player.classicHand || []).length}
            isCurrent={player.id === selectedPlayerId}
            isReady={player.ready}
            isTurnToPlay={player.id === selectedPlayerId}
            lifes={player.lifes}
            mana={null}
            nickname={player.nickname}
            points={player.points}
            position={getSeatPosition(
              index,
              orderedPlayers.length,
              player.id === selectedPlayerId,
              visualConfig.seatOrbitX || 36,
              visualConfig.seatOrbitY || 28,
              visualConfig.seatLift ?? 2,
            )}
            visualScale={(visualConfig.seatScale || 1) * tableScale}
          />
        ))}
        <PlayedCardAnimation
          animationDuration={animationDuration}
          card={animationCard}
          cardBackSrc={cardBack}
          deckType={deckTypes.SPANISH_8BIT}
          onAnimationEnd={onAnimationEnd}
        />
        <BidControls
          onBid={onBid}
          possibleBids={[0, 1, 2, 3, 4, 5]}
          visualOffsetX={visualConfig.bidControlOffsetX || 0}
          visualOffsetY={visualConfig.bidControlOffsetY || 0}
          visualScale={(visualConfig.bidControlScale || 1) * tableScale}
        />
      </div>
      <div
        className="relative h-[14.85rem] shrink-0 bg-zinc-950"
        style={
          visualConfig.classicHandAreaHeightVh
            ? { height: `${visualConfig.classicHandAreaHeightVh}vh` }
            : undefined
        }
      >
        <PlayerHand
          canPlayCards
          cardBackSrc={cardBack}
          cards={currentPlayer?.classicHand || []}
          centered
          deckType={deckTypes.SPANISH_8BIT}
          onPlayCard={onClassicPlay}
          upcard={upcard}
          visualContainerHeightVh={visualConfig.classicHandAreaHeightVh || 0}
          visualContainerWidthVw={visualConfig.classicHandBoxWidthVw || 0}
          visualContainerOffsetX={visualConfig.classicHandBoxOffsetX || 0}
          visualContainerOffsetY={visualConfig.classicHandBoxOffsetY || 0}
          visualOffsetX={visualConfig.classicHandOffsetX || 0}
          visualOffsetY={visualConfig.classicHandOffsetY || 0}
          visualScale={(visualConfig.classicHandScale || 1) * tableScale}
        />
      </div>
    </div>
  );
}
