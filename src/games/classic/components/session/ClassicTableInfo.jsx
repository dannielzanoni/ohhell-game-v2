import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Info, MessageSquareText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CLASSIC_SUIT_CARDS } from '@/games/classic/assets/cardAssetRegistry.js';
import {
  getClassicCardRankCode,
  getClassicSuitTranslationKey,
} from '@/games/classic/presentation/cardLabels.js';
import bidIcon from '@/shared/assets/icons/bid.svg';
import { cn } from '@/shared/lib/utils.js';
import { Button } from '@/shared/ui/button.jsx';

function formatClassicActionLog(entry, t) {
  const playerName = entry.player ? (
    <strong className="font-black text-white">{entry.player}</strong>
  ) : null;

  switch (entry.type) {
    case 'setStarted':
      return t('game.actionLog.setStarted');
    case 'cardPlayed': {
      const rank = getClassicCardRankCode(entry.card);
      const suitKey = getClassicSuitTranslationKey(entry.card);
      const suit = suitKey
        ? t(`pages.howToPlay.rules.suits.${suitKey}`).toLowerCase()
        : entry.card?.suit || '?';

      return (
        <>
          {playerName}{' '}
          {t('game.actionLog.cardPlayed', {
            card: t('game.actionLog.cardLabel', { rank, suit }),
          })}
        </>
      );
    }
    case 'roundWon':
      return (
        <>
          {playerName} {t('game.actionLog.roundWon')}
        </>
      );
    case 'setEnded':
      return t('game.actionLog.setEnded');
    case 'lifesLost':
      return (
        <>
          {playerName} {t('game.actionLog.lifesLost')}{' '}
          <strong className="font-black text-red-500">-{entry.count}</strong>{' '}
          {t('game.actionLog.lifeUnit')}
        </>
      );
    default:
      return '';
  }
}

export function ClassicTableInfo({
  bidSum = 0,
  logs,
  open,
  onToggle,
  tableBid = 0,
  visualOffsetX = 0,
  visualOffsetY = 0,
  visualScale = 1,
}) {
  const { t } = useTranslation();
  const logEndRef = useRef(null);
  const [logOpen, setLogOpen] = useState(true);

  useEffect(() => {
    if (logOpen) {
      logEndRef.current?.scrollIntoView({ block: 'nearest' });
    }
  }, [logOpen, logs]);

  return (
    <aside
      className="absolute left-3 top-3 z-40 flex max-w-[calc(100%-1.5rem)] flex-col items-start gap-2 sm:left-5 sm:top-5"
      style={{
        transform: `translate(${visualOffsetX}%, ${visualOffsetY}%) scale(${visualScale})`,
        transformOrigin: 'left top',
      }}
    >
      <Button
        type="button"
        variant="outline"
        aria-expanded={open}
        aria-controls="classic-table-info"
        className="h-10 cursor-pointer gap-2 border-white/20 bg-black/90 px-3 font-bold text-white shadow-lg shadow-black/50 backdrop-blur hover:border-amber-300/60 hover:bg-zinc-900 hover:text-amber-100"
        onClick={onToggle}
      >
        <Info className="size-4" />
        {t('game.classicInfo.button')}
      </Button>

      {open ? (
        <div
          id="classic-table-info"
          className="w-[min(25rem,calc(100vw-1.5rem))] rounded-md border border-white/15 bg-black/95 p-4 text-white shadow-2xl shadow-black/70 backdrop-blur-md"
        >
          <h2 className="text-sm font-black uppercase text-amber-300">
            {t('game.classicInfo.title')}
          </h2>

          <div className="mt-4">
            <p className="text-xs font-bold uppercase text-zinc-400">
              {t('game.classicInfo.ranks')}
            </p>
            <p className="mt-2 text-base font-black tracking-normal text-white">
              4, 5, 6, 7, 10, 11, 12, 1, 2, 3
            </p>
          </div>

          <div className="mt-4">
            <p className="text-xs font-bold uppercase text-zinc-400">
              {t('game.classicInfo.suits')}
            </p>
            <div className="mt-2 overflow-x-auto pb-1">
              <div className="flex min-w-max gap-2">
                {CLASSIC_SUIT_CARDS.map(([suit, imageSrc]) => (
                  <figure key={suit} className="w-16 shrink-0 text-center">
                    <img
                      src={imageSrc}
                      alt={t('pages.howToPlay.rules.cardAlt', {
                        label: t(`pages.howToPlay.rules.suits.${suit}`),
                      })}
                      className="aspect-[2/3] w-full rounded border border-white/15 object-cover shadow-md shadow-black/60"
                      draggable="false"
                    />
                    <figcaption className="mt-1 text-[0.65rem] font-bold uppercase text-zinc-300">
                      {t(`pages.howToPlay.rules.suits.${suit}`)}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <section
        className={cn(
          'flex flex-col overflow-hidden rounded-md border border-white/15 bg-black/95 text-white shadow-2xl shadow-black/70 backdrop-blur-md transition-[height,width] duration-200 ease-out',
          logOpen
            ? 'h-48 w-[min(25rem,calc(100vw-1.5rem))]'
            : 'h-10 w-[min(11rem,calc(100vw-1.5rem))]',
        )}
      >
        <button
          type="button"
          aria-controls="classic-action-log"
          aria-expanded={logOpen}
          className="flex h-10 w-full shrink-0 cursor-pointer items-center gap-2 border-b border-white/10 px-3 text-left text-xs font-black text-zinc-200 transition-colors hover:bg-white/5 hover:text-amber-100"
          onClick={() => setLogOpen((current) => !current)}
        >
          <MessageSquareText className="size-4 shrink-0 text-amber-300" />
          <span className="flex-1 whitespace-nowrap">{t('game.actionLog.title')}</span>
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-zinc-400 transition-transform duration-200',
              logOpen && 'rotate-180',
            )}
          />
        </button>
        {logOpen ? (
          <div
            id="classic-action-log"
            className="min-h-0 flex-1 overflow-y-auto px-3 py-2"
            aria-live="polite"
            aria-label={t('game.actionLog.title')}
          >
            {logs.length ? (
              <ol className="space-y-1.5">
                {logs.map((entry) => (
                  <li
                    key={entry.id}
                    className="border-l-2 border-amber-300/45 pl-2 text-xs font-medium leading-5 text-zinc-200"
                  >
                    {formatClassicActionLog(entry, t)}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-xs leading-5 text-zinc-500">{t('game.actionLog.empty')}</p>
            )}
            <span ref={logEndRef} aria-hidden="true" />
          </div>
        ) : null}
      </section>

      <div
        className={cn(
          'grid gap-1.5 rounded-md border border-white/15 bg-black/90 p-3 text-xs font-bold text-zinc-200 shadow-xl shadow-black/50 backdrop-blur transition-[width] duration-200 ease-out',
          logOpen ? 'w-[min(25rem,calc(100vw-1.5rem))]' : 'w-[min(11rem,calc(100vw-1.5rem))]',
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <span>{t('game.classicInfo.bidSum')}</span>
          <strong className="inline-flex items-center gap-1 text-sm text-amber-100">
            {bidSum}
            <img src={bidIcon} alt="" className="size-4 object-contain" draggable="false" />
          </strong>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>{t('game.classicInfo.tableBid')}</span>
          <strong className="inline-flex items-center gap-1 text-sm text-amber-100">
            {tableBid}
            <img src={bidIcon} alt="" className="size-4 object-contain" draggable="false" />
          </strong>
        </div>
      </div>
    </aside>
  );
}
