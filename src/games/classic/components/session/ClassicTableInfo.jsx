import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, Info, MessageCircle, MessageSquareText, ScrollText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CLASSIC_SUIT_CARDS } from '@/games/classic/assets/cardAssetRegistry.js';
import {
  getClassicCardRankCode,
  getClassicSuitTranslationKey,
} from '@/games/classic/presentation/cardLabels.js';
import bidIcon from '@/shared/assets/icons/bid.svg';
import { cn } from '@/shared/lib/utils.js';
import { Button } from '@/shared/ui/button.jsx';
import { ClassicChatPanel } from './ClassicChatPanel.jsx';

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

function normalizeNickname(value) {
  return String(value || '')
    .trim()
    .toLocaleLowerCase();
}

function NotificationBadge({ count, label }) {
  if (!count) return null;

  return (
    <span
      aria-label={label}
      className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[0.62rem] font-black leading-none text-white shadow-sm shadow-red-950/60"
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

export function ClassicTableInfo({
  bidSum = 0,
  chatEnabled = false,
  currentPlayer = null,
  lobbyId,
  logs = [],
  open,
  onToggle,
  players = [],
  tableBid = 0,
  visualOffsetX = 0,
  visualOffsetY = 0,
  visualScale = 1,
}) {
  const { t } = useTranslation();
  const logEndRef = useRef(null);
  const lastChatMessageIdRef = useRef(null);
  const lastLogIdRef = useRef(logs.at(-1)?.id ?? null);
  const notificationLobbyIdRef = useRef(lobbyId);
  const [activeTab, setActiveTab] = useState('chat');
  const [panelOpen, setPanelOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unreadLogCount, setUnreadLogCount] = useState(0);

  const handleChatMessagesChange = useCallback(
    (messages) => {
      const latestMessage = messages.at(-1);
      if (!latestMessage || latestMessage.id === lastChatMessageIdRef.current) return;

      const previousMessageIndex = messages.findIndex(
        (message) => message.id === lastChatMessageIdRef.current,
      );
      const newMessages =
        previousMessageIndex >= 0 ? messages.slice(previousMessageIndex + 1) : messages;
      lastChatMessageIdRef.current = latestMessage.id;

      if (panelOpen && activeTab === 'chat') return;

      const currentNickname = normalizeNickname(currentPlayer?.nickname);
      const incomingMessageCount = newMessages.filter((message) => {
        return normalizeNickname(message.user) !== currentNickname;
      }).length;

      if (incomingMessageCount) {
        setUnreadChatCount((currentCount) => currentCount + incomingMessageCount);
      }
    },
    [activeTab, currentPlayer?.nickname, panelOpen],
  );

  useEffect(() => {
    if (notificationLobbyIdRef.current === lobbyId) return;
    notificationLobbyIdRef.current = lobbyId;
    lastChatMessageIdRef.current = null;
    lastLogIdRef.current = logs.at(-1)?.id ?? null;
    setUnreadChatCount(0);
    setUnreadLogCount(0);
  }, [lobbyId, logs]);

  useEffect(() => {
    const latestLog = logs.at(-1);
    if (!latestLog || latestLog.id === lastLogIdRef.current) return;

    const previousLogIndex = logs.findIndex((entry) => entry.id === lastLogIdRef.current);
    const newLogCount = previousLogIndex >= 0 ? logs.length - previousLogIndex - 1 : logs.length;
    lastLogIdRef.current = latestLog.id;

    if (!(panelOpen && activeTab === 'log')) {
      setUnreadLogCount((currentCount) => currentCount + newLogCount);
    }
  }, [activeTab, logs, panelOpen]);

  useEffect(() => {
    if (!panelOpen) return;
    if (activeTab === 'chat') setUnreadChatCount(0);
    if (activeTab === 'log') setUnreadLogCount(0);
  }, [activeTab, panelOpen]);

  useEffect(() => {
    if (panelOpen && activeTab === 'log') {
      logEndRef.current?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [activeTab, logs, panelOpen]);

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
        id="classic-match-panel"
        className={cn(
          'flex flex-col overflow-hidden rounded-md border border-white/15 bg-black/95 text-white shadow-2xl shadow-black/70 backdrop-blur-md transition-[height,width] duration-200 ease-out',
          panelOpen
            ? 'h-[24rem] w-[min(25rem,calc(100vw-1.5rem))]'
            : 'h-10 w-[min(12rem,calc(100vw-1.5rem))]',
        )}
      >
        <button
          type="button"
          aria-expanded={panelOpen}
          className="flex h-10 w-full shrink-0 cursor-pointer items-center gap-2 border-b border-white/10 px-3 text-left text-xs font-black text-zinc-200 transition-colors hover:bg-white/5 hover:text-amber-100"
          onClick={() => setPanelOpen((current) => !current)}
        >
          <MessageSquareText className="size-4 shrink-0 text-amber-300" />
          <span className="flex-1 whitespace-nowrap">{t('game.matchPanel.title')}</span>
          {!panelOpen ? (
            <NotificationBadge
              count={unreadChatCount}
              label={t('game.matchPanel.unreadChat', { count: unreadChatCount })}
            />
          ) : null}
          <ChevronDown
            className={cn(
              'size-4 shrink-0 text-zinc-400 transition-transform duration-200',
              panelOpen && 'rotate-180',
            )}
          />
        </button>

        <div
          className={cn('min-h-0 flex-1 flex-col', panelOpen ? 'flex' : 'hidden')}
          aria-hidden={!panelOpen}
        >
          <div
            role="tablist"
            aria-label={t('game.matchPanel.title')}
            className="grid h-10 shrink-0 grid-cols-2 border-b border-white/10 bg-zinc-950"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'chat'}
              className={cn(
                'inline-flex cursor-pointer items-center justify-center gap-1.5 border-b-2 px-2 text-xs font-black transition',
                activeTab === 'chat'
                  ? 'border-amber-300 bg-amber-300/10 text-amber-200'
                  : 'border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-200',
              )}
              onClick={() => setActiveTab('chat')}
            >
              <MessageCircle className="size-3.5" />
              {t('game.matchPanel.chatTab')}
              <NotificationBadge
                count={unreadChatCount}
                label={t('game.matchPanel.unreadChat', { count: unreadChatCount })}
              />
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'log'}
              className={cn(
                'inline-flex cursor-pointer items-center justify-center gap-1.5 border-b-2 px-2 text-xs font-black transition',
                activeTab === 'log'
                  ? 'border-amber-300 bg-amber-300/10 text-amber-200'
                  : 'border-transparent text-zinc-400 hover:bg-white/5 hover:text-zinc-200',
              )}
              onClick={() => setActiveTab('log')}
            >
              <ScrollText className="size-3.5" />
              {t('game.matchPanel.logTab')}
              <NotificationBadge
                count={unreadLogCount}
                label={t('game.matchPanel.unreadLog', { count: unreadLogCount })}
              />
            </button>
          </div>

          <div
            role="tabpanel"
            className={cn('min-h-0 flex-1', activeTab === 'chat' ? 'flex' : 'hidden')}
          >
            <ClassicChatPanel
              currentPlayer={currentPlayer}
              enabled={chatEnabled}
              lobbyId={lobbyId}
              onMessagesChange={handleChatMessagesChange}
              players={players}
            />
          </div>

          <div
            role="tabpanel"
            id="classic-action-log"
            className={cn(
              'min-h-0 flex-1 overflow-y-auto px-3 py-2',
              activeTab === 'log' ? 'block' : 'hidden',
            )}
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
        </div>
      </section>

      <div
        className={cn(
          'grid gap-1.5 rounded-md border border-white/15 bg-black/90 p-3 text-xs font-bold text-zinc-200 shadow-xl shadow-black/50 backdrop-blur transition-[width] duration-200 ease-out',
          panelOpen ? 'w-[min(25rem,calc(100vw-1.5rem))]' : 'w-[min(12rem,calc(100vw-1.5rem))]',
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
