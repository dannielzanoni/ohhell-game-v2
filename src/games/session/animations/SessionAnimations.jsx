import { UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getClassicCardImageSrc } from '@/games/classic/assets/cardAssetRegistry.js';
import { Button } from '@/shared/ui/button.jsx';

export function PlayedCardAnimation({
  animationDuration,
  card,
  cardBackSrc,
  deckType,
  onAnimationEnd,
}) {
  if (!card) {
    return null;
  }

  return (
    <img
      src={getClassicCardImageSrc(card, deckType, cardBackSrc)}
      alt=""
      className="ohhell-card-play-animation absolute bottom-8 left-1/2 z-50 h-[8.47rem] w-[5.72rem] rounded-lg border-2 border-black object-cover shadow-2xl shadow-black/70 sm:h-[10.89rem] sm:w-[7.26rem]"
      draggable="false"
      style={animationDuration ? { animationDuration: `${animationDuration}ms` } : undefined}
      onAnimationEnd={onAnimationEnd}
    />
  );
}

export function GameEndedOverlay({ onBackToMenu, summary }) {
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

export function LifeLossPopup({ highlight }) {
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
          <img src={player.avatarSrc} alt="" className="size-full object-cover" draggable="false" />
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
