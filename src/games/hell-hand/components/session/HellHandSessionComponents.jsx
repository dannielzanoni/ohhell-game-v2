import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Crown, Sparkles, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import manaIcon from '@/games/hell-hand/assets/icons/mana.png';
import {
  getMercenarySubtitle,
  getMercenaryTitle,
} from '@/games/hell-hand/mercenaries/mercenaries.js';
import { cn } from '@/shared/lib/utils.js';
import { Button } from '@/shared/ui/button.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog.jsx';

export function WaitingPowerLobbyInfo({ deckInfo, deckKind, deckName, lifeMultiplier }) {
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
          {deckInfo ? <p className="mt-1 text-xs text-stone-400">{deckInfo}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

export function ManaPool({ mana }) {
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
      <img src={manaIcon} alt="" className="size-4 shrink-0 object-contain" draggable="false" />
      <span className="h-2 w-[6.75rem] overflow-hidden rounded-full bg-sky-950/80 ring-1 ring-sky-200/20">
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

export function PowerCardHand({
  canDiscardPowerCards = false,
  canSkipPowerPhase,
  canUsePowerCards,
  cards,
  onPowerCardDragEnd,
  onPowerCardDragStart,
  onSkipPowerPhase,
  onUsePowerCard,
  visualOffsetX = 0,
  visualOffsetY = 0,
  visualScale = 1,
}) {
  const { t } = useTranslation();
  const [hoveredPowerCard, setHoveredPowerCard] = useState(null);

  if (!cards.length && !canSkipPowerPhase) {
    return null;
  }

  return (
    <div
      className={`absolute bottom-0 right-3 z-40 flex h-[13.5rem] w-[calc(50%-0.75rem)] items-end justify-start gap-2 rounded-lg border border-white/10 bg-black/60 px-4 pb-3 shadow-2xl shadow-black/45 backdrop-blur-sm sm:h-[14.85rem] ${cards.length > 5 ? 'overflow-x-auto overflow-y-hidden' : 'overflow-visible'}`}
      style={{
        transform: `translate(${visualOffsetX}%, ${visualOffsetY}%)`,
        transformOrigin: 'left bottom',
      }}
    >
      <div
        className="flex min-w-full w-max items-end justify-start gap-2"
        style={{ scale: visualScale, transformOrigin: 'left bottom' }}
      >
        {cards.map((card, index) => {
          const isTargetable = card.type === 'targetable';
          const isMultiTargetable = card.type === 'multi_targetable';
          const cardReady = card?.state?.ready !== false;
          const canUseCard = canUsePowerCards && cardReady && !isMultiTargetable;
          const canDrag = canUseCard && (isTargetable || canDiscardPowerCards);
          const imageSrc = card.image || card.image_url || '';

          return (
            <button
              key={`${card.id}-${index}`}
              dir="ltr"
              type="button"
              disabled={!canUseCard}
              draggable={canDrag}
              title={
                !cardReady
                  ? card.state?.reason || card.description || card.name
                  : isMultiTargetable
                    ? t('game.multiTargetUnavailable')
                    : isTargetable
                      ? t('game.powerCardDragToTarget')
                      : card.description || card.name
              }
              className={`${
                imageSrc
                  ? 'aspect-[0.58] w-20 overflow-hidden rounded-lg border-2 border-black bg-black p-0 sm:w-24'
                  : 'min-w-36 rounded-2xl border border-violet-200/40 bg-violet-950/90 px-4 py-3 text-left text-white backdrop-blur sm:min-w-44'
              } origin-bottom shrink-0 shadow-2xl shadow-black/50 transition ${
                canUseCard
                  ? isTargetable
                    ? 'cursor-grab hover:z-50 hover:-translate-y-1 hover:scale-145 hover:border-violet-200 active:cursor-grabbing active:translate-y-0'
                    : 'cursor-pointer hover:z-50 hover:-translate-y-1 hover:scale-145 hover:border-violet-200 active:translate-y-0'
                  : 'cursor-not-allowed opacity-70'
              }`}
              onMouseEnter={(event) => {
                if (cards.length <= 5 || !imageSrc) return;
                const rect = event.currentTarget.getBoundingClientRect();
                setHoveredPowerCard({ card, left: rect.left + rect.width / 2, top: rect.bottom });
              }}
              onMouseLeave={() => setHoveredPowerCard(null)}
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
              {imageSrc ? (
                <img
                  src={imageSrc}
                  alt={card.name || t('game.powerCard')}
                  className="size-full object-cover"
                  draggable="false"
                />
              ) : (
                <>
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
                </>
              )}
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
      {hoveredPowerCard
        ? createPortal(
            <img
              src={hoveredPowerCard.card.image || hoveredPowerCard.card.image_url}
              alt={hoveredPowerCard.card.name || t('game.powerCard')}
              className="pointer-events-none fixed z-[200] aspect-[0.58] w-24 origin-bottom rounded-lg border-2 border-violet-200 object-cover shadow-2xl shadow-black sm:w-28"
              draggable="false"
              style={{
                left: hoveredPowerCard.left,
                top: hoveredPowerCard.top,
                transform: 'translate(-50%, -100%) scale(1.45)',
              }}
            />,
            document.body,
          )
        : null}
    </div>
  );
}

export function HellHandMercenaryJoinGate({
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
        className="pointer-events-auto z-[70] max-h-[90dvh] w-[min(96vw,72rem)] max-w-none overflow-hidden border-red-200/15 bg-black/92 p-0 text-stone-100 shadow-2xl shadow-black/55 sm:max-w-none"
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

        <div className="max-h-[calc(90dvh-7.5rem)] overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-40 animate-pulse rounded-lg border border-red-200/10 bg-red-950/20"
                />
              ))}
            </div>
          ) : characters.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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
                    className="group grid min-h-40 cursor-pointer grid-cols-[7rem_1fr] overflow-hidden rounded-lg border border-red-200/15 bg-black/70 text-left shadow-lg shadow-black/35 outline-none transition hover:border-amber-300/60 hover:bg-red-950/35 focus-visible:ring-2 focus-visible:ring-amber-300"
                    onClick={() => onSelect(character.id)}
                  >
                    <span className="relative block size-full min-h-40 overflow-hidden bg-red-950/35">
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
