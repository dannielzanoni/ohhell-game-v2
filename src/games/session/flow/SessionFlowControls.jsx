import { useEffect, useRef, useState } from 'react';
import { Check, Copy, Link as LinkIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getTimerSnapshot, useTimerNow } from '@/games/session/flow/timerFlow.js';

export function ReadyControls({
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

export function ReadyStatusBadge({ isReady }) {
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

export function BidControls({
  onBid,
  possibleBids,
  visualOffsetX = 0,
  visualOffsetY = 0,
  visualScale = 1,
}) {
  if (!possibleBids.length) return null;
  return (
    <div
      className="absolute bottom-40 left-1/2 z-40 flex max-w-[calc(100vw-2rem)] flex-wrap justify-center gap-2 rounded-2xl border border-red-300/20 bg-black/95 p-3 shadow-2xl shadow-black/50 backdrop-blur sm:bottom-73"
      style={{
        transform: `translate(calc(-50% + ${visualOffsetX}%), ${visualOffsetY}%) scale(${visualScale})`,
        transformOrigin: 'center bottom',
      }}
    >
      {possibleBids.map((bid) => (
        <button
          key={bid}
          type="button"
          className="size-12 cursor-pointer rounded-xl border border-red-300/50 bg-red-600 text-base font-black text-white shadow-lg shadow-black/30 transition duration-150 ease-out hover:z-10 hover:scale-115 hover:bg-red-500"
          onClick={() => onBid(bid)}
        >
          {bid}
        </button>
      ))}
    </div>
  );
}

export function ActionTimer({
  onExpire,
  timer,
  visualOffsetX = 0,
  visualOffsetY = 0,
  visualScale = 1,
}) {
  const { t } = useTranslation();
  const now = useTimerNow(timer);
  const expiredTimerIdRef = useRef('');

  useEffect(() => {
    expiredTimerIdRef.current = '';
  }, [timer?.id]);
  useEffect(() => {
    if (!timer) return;
    const remainingMs = timer.durationMs - Math.max(0, now - timer.startedAt);
    if (remainingMs > 0 || expiredTimerIdRef.current === timer.id) return;
    expiredTimerIdRef.current = timer.id;
    onExpire?.(timer);
  }, [now, onExpire, timer]);
  if (!timer) return null;

  const { progress, seconds } = getTimerSnapshot(timer, now);
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
      className="pointer-events-none absolute left-1/2 top-4 z-50 w-[min(24rem,calc(100vw-5rem))] rounded-full border border-white/15 bg-black/80 px-3 py-2 text-white shadow-2xl shadow-black/50 backdrop-blur"
      style={{
        transform: `translate(calc(-50% + ${visualOffsetX}%), ${visualOffsetY}%) scale(${visualScale})`,
        transformOrigin: 'center top',
      }}
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

export function RoomLinkCopy({ lobbyId }) {
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
