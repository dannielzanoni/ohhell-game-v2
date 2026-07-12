import { useMemo } from 'react';
import { Layers3, Plus, Sparkles, Trash2 } from 'lucide-react';
import cardBack from '@/assets/cards/back_cards/back_card.png';
import magicCardBack from '@/assets/hell hand/cards/back_card_magic.jpg';
import { Button } from '@/components/ui/button.jsx';
import gameTableBackground from '@/assets/backgrounds/game-table-bg.png';
import { findMercenary, mercenaries } from '@/app/routes/Characters/characterData.js';
import {
  BidControls,
  PlayedCardAnimation,
  PlayerHand,
  PlayerSeat,
  PowerCardHand,
  TableCenter,
  getSeatPosition,
} from '@/app/routes/Game/Game.jsx';

function DeckMarker({ count, label, power = false }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/65 px-3 py-2 text-white shadow-xl backdrop-blur">
      <div className="relative grid size-8 place-items-center">
        <img
          src={cardBack}
          alt=""
          className="absolute size-7 rounded border border-black object-cover opacity-70"
          draggable="false"
        />
        {power ? (
          <Sparkles className="relative z-10 size-4 text-violet-200" />
        ) : (
          <Layers3 className="relative z-10 size-4 text-amber-200" />
        )}
      </div>
      <div>
        <span className="block text-[0.58rem] font-black uppercase tracking-[0.16em] text-zinc-400">
          {label}
        </span>
        <strong className="block text-sm text-white">{count}</strong>
      </div>
    </div>
  );
}

function PowerDeckControl({ count, onDraw, visualOffsetX, visualOffsetY, visualScale }) {
  return (
    <div
      className="absolute right-6 top-1/2 z-40 grid justify-items-center gap-3"
      style={{
        transform: `translate(${visualOffsetX}%, calc(-50% + ${visualOffsetY}%)) scale(${visualScale})`,
        transformOrigin: 'center',
      }}
    >
      <div className="relative h-32 w-[4.65rem]">
        <img src={magicCardBack} alt="" className="absolute -left-2 -top-2 size-full rounded-lg border-2 border-violet-200/20 object-cover opacity-45" draggable="false" />
        <img src={magicCardBack} alt="Deck mágico" className="relative size-full rounded-lg border-2 border-violet-200/50 object-cover shadow-2xl shadow-black/70" draggable="false" />
        <span className="absolute -right-2 -top-2 grid size-7 place-items-center rounded-full bg-violet-200 text-xs font-black text-zinc-950 shadow-lg">{count}</span>
      </div>
      <Button type="button" disabled={!count} onClick={onDraw}>
        <Plus /> Comprar
      </Button>
    </div>
  );
}

function PowerDiscard({ cards, draggingCard, onDiscard }) {
  const topCard = cards[cards.length - 1];
  return (
    <div
      className={`absolute bottom-6 right-36 z-40 grid h-32 w-24 place-items-center rounded-lg border-2 border-dashed p-2 text-center transition ${draggingCard ? 'border-violet-200 bg-violet-400/20' : 'border-white/20 bg-black/55'}`}
      onDragOver={(event) => {
        if (!draggingCard) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(event) => {
        if (!draggingCard) return;
        event.preventDefault();
        onDiscard?.(draggingCard.id);
      }}
    >
      {topCard?.image || topCard?.image_url ? (
        <img src={topCard.image || topCard.image_url} alt="" className="absolute inset-2 size-[calc(100%-1rem)] rounded object-cover opacity-55" draggable="false" />
      ) : null}
      <div className="relative z-10 grid justify-items-center gap-1 text-xs font-black text-violet-100">
        <Trash2 className="size-5" />
        Descarte
        <span>{cards.length}</span>
      </div>
    </div>
  );
}

export function GameTableView({
  actionTimer = null,
  animationCard = null,
  animationDuration,
  bidControlOffsetX = 0,
  bidControlOffsetY = 0,
  bidControlScale = 1,
  draggingPowerCard = null,
  deckType,
  onAnimationEnd,
  onBid,
  onClassicPlay,
  onPowerCardDragEnd,
  onPowerCardDragStart,
  onPowerCardDrop,
  onPowerCardDiscard,
  onPowerCardPlay,
  onSkipPowerPhase,
  pile,
  players,
  powerDeck,
  powerDiscard = [],
  powerDeckControlOffsetX = 0,
  powerDeckControlOffsetY = 0,
  powerDeckControlScale = 1,
  onPowerDeckDraw,
  powerHandScale = 1,
  powerHandOffsetX = 0,
  powerHandOffsetY = 0,
  seatOrbitX = 36,
  seatOrbitY = 28,
  seatLift = 2,
  centerScale = 1,
  centerOffsetX = 0,
  centerOffsetY = 0,
  selectedPlayerId,
  showGuides = false,
  seatScale = 1,
  tableScale = 1,
  classicHandScale = 1,
  classicHandOffsetY = 10,
  upcard,
}) {
  const currentPlayer = players.find((player) => player.id === selectedPlayerId) || players[0];
  const playerMap = useMemo(
    () => Object.fromEntries(players.map((player) => [player.id, player])),
    [players],
  );
  const currentIndex = Math.max(0, players.findIndex((player) => player.id === currentPlayer?.id));
  const orderedPlayers = [
    ...players.slice(currentIndex),
    ...players.slice(0, currentIndex),
  ];
  const playerDeck = currentPlayer?.classicHand || [];
  const powerCards = currentPlayer?.powerHand || [];

  return (
    <div
      className="relative flex min-h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-[1.75rem] border border-amber-200/15 bg-black shadow-2xl shadow-black/35"
    >
      <div
        className="relative min-h-0 flex-1 overflow-hidden bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.35)), url(${gameTableBackground})`,
        }}
      >
      <div
        className="absolute inset-0 transition-transform duration-300"
        style={{ transform: `scale(${tableScale})`, transformOrigin: 'center center' }}
      >
        <div className="absolute left-4 top-4 z-40 flex flex-wrap gap-2">
          <DeckMarker count={pile.length} label="Classic pile" />
          <DeckMarker count={powerDeck.length} label="Power deck" power />
        </div>

        {showGuides ? (
          <div className="pointer-events-none absolute inset-[10%] z-20 rounded-full border border-dashed border-amber-200/25" />
        ) : null}

        <TableCenter
          cardBackSrc={cardBack}
          deckType={deckType}
          elevatedPileCardKey=""
          pile={pile}
          playersById={playerMap}
          upcard={upcard}
          visualOffsetX={centerOffsetX}
          visualOffsetY={centerOffsetY}
          visualScale={centerScale}
        />

        {orderedPlayers.map((player, index) => (
          <PlayerSeat
            key={player.id}
            avatarSrc={player.avatarSrc}
            cardBackSrc={cardBack}
            bid={player.bid}
            cardCount={(player.classicHand || []).length + (player.powerHand || []).length}
            canDropPowerCard={Boolean(draggingPowerCard)}
            draggingPowerCard={draggingPowerCard}
            isCurrent={player.id === selectedPlayerId}
            isReady={player.ready}
            isTurnToPlay={player.id === selectedPlayerId}
            lifes={player.lifes}
            maxLifes={5}
            mana={player.mana}
            mercenaryIconSrc={
              findMercenary(player.mercenaryId || player.nickname, mercenaries)?.icon || ''
            }
            nickname={player.nickname}
            onPowerCardDrop={() => onPowerCardDrop?.(player.id)}
            position={getSeatPosition(
              index,
              orderedPlayers.length,
              player.id === selectedPlayerId,
              seatOrbitX,
              seatOrbitY,
              seatLift,
            )}
            points={player.points}
            showReadyState={false}
            turnTimer={player.id === selectedPlayerId ? actionTimer : null}
            visualScale={seatScale}
          />
        ))}

        <PlayedCardAnimation
          animationDuration={animationDuration}
          card={animationCard}
          cardBackSrc={cardBack}
          deckType={deckType}
          onAnimationEnd={onAnimationEnd}
        />
      </div>
        <BidControls
          onBid={onBid}
          possibleBids={[0, 1, 2, 3, 4, 5]}
          visualOffsetX={bidControlOffsetX}
          visualOffsetY={bidControlOffsetY}
          visualScale={bidControlScale}
        />
        <PowerDeckControl
          count={powerDeck.length}
          onDraw={onPowerDeckDraw}
          visualOffsetX={powerDeckControlOffsetX}
          visualOffsetY={powerDeckControlOffsetY}
          visualScale={powerDeckControlScale}
        />
        <PowerDiscard
          cards={powerDiscard}
          draggingCard={draggingPowerCard}
          onDiscard={onPowerCardDiscard}
        />
      </div>

      <div className="relative h-[14.85rem] shrink-0 bg-zinc-950">

        <PowerCardHand
          canDiscardPowerCards
          canSkipPowerPhase={false}
          canUsePowerCards
          cards={powerCards}
          onPowerCardDragEnd={onPowerCardDragEnd}
          onPowerCardDragStart={onPowerCardDragStart}
          onSkipPowerPhase={onSkipPowerPhase}
          onUsePowerCard={onPowerCardPlay}
          visualOffsetX={powerHandOffsetX}
          visualOffsetY={powerHandOffsetY}
          visualScale={powerHandScale}
        />
        <PlayerHand
          canPlayCards
          cardBackSrc={cardBack}
          cards={playerDeck}
          deckType={deckType}
          onPlayCard={onClassicPlay}
          upcard={upcard}
          visualOffsetY={classicHandOffsetY}
          visualScale={classicHandScale}
        />
      </div>
    </div>
  );
}
