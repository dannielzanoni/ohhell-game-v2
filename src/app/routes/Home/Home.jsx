import { useCallback, useEffect, useState } from 'react';
import { BookOpen, Crown, Play, Settings, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import gameTableBg from '@/assets/backgrounds/game-table-bg.png';
import card1Espada8Bit from '@/assets/cards/spanish_8bit/1espada.png';
import card3Paus8Bit from '@/assets/cards/spanish_8bit/3paus.png';
import card12Copas8Bit from '@/assets/cards/spanish_8bit/12copas.png';
import gameBg from '@/assets/videos/game-bg.mp4';
import { LoginCard } from '@/components/auth/LoginCard.jsx';
import { GameSettingsModal } from '@/components/settings/GameSettingsModal.jsx';
import { VideoText } from '@/components/ui/video-text.jsx';
import { LANGUAGE_STORAGE_KEY } from '@/i18n/index.js';
import { authService } from '@/services/authService.js';
import { getMyStats } from '@/services/statsService.js';

const homeActions = [
  { icon: Play, labelKey: 'pages.links.createGame.label', path: '/create-game' },
  { icon: Users, labelKey: 'pages.links.rooms.label', path: '/rooms' },
  { icon: Crown, labelKey: 'pages.links.leaderboard.label', path: '/leaderboard' },
  { icon: BookOpen, labelKey: 'pages.links.howToPlay.label', path: '/how-to-play' },
];

const playerStatItems = [
  {
    labelKey: 'leaderboard.games',
    getValue: (stats) => formatNumber(stats.games_played),
  },
  {
    labelKey: 'leaderboard.wins',
    getValue: (stats) => formatNumber(stats.matches_won),
  },
  {
    labelKey: 'leaderboard.winRate',
    getValue: (stats) => formatPercent(stats.win_rate),
  },
  {
    labelKey: 'leaderboard.rounds',
    getValue: (stats) => formatNumber(stats.rounds_won),
  },
  {
    labelKey: 'leaderboard.bidHit',
    getValue: (stats) => formatPercent(stats.bid_accuracy),
  },
  {
    labelKey: 'leaderboard.averageBid',
    getValue: (stats) => formatNumber(stats.average_bid, 2),
  },
];

function formatNumber(value, fractionDigits = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(fractionDigits) : '0';
}

function formatPercent(value) {
  const number = Number(value);
  return Number.isFinite(number) ? `${number.toFixed(1)}%` : '0.0%';
}

function PlayerStatsPanel({ error, isLoading, stats, t }) {
  return (
    <section className="rounded-lg border border-white/15 bg-black/68 p-4 text-white shadow-2xl shadow-black/35 backdrop-blur">
      <p className="text-xs font-semibold uppercase tracking-wide text-amber-300">
        {t('pages.home.stats.eyebrow')}
      </p>
      <h2 className="mt-1 text-lg font-black tracking-tight text-white">
        {t('pages.home.stats.title')}
      </h2>

      {isLoading ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-md bg-white/10" />
          ))}
        </div>
      ) : error ? (
        <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm leading-5 text-destructive">
          {error}
        </p>
      ) : stats ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {playerStatItems.map((item) => (
            <div key={item.labelKey} className="rounded-md border border-white/8 bg-white/7 px-3 py-2">
              <span className="block text-xs font-semibold text-stone-400">
                {t(item.labelKey)}
              </span>
              <strong className="mt-1 block text-xl font-black text-white">
                {item.getValue(stats)}
              </strong>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-stone-400">
          {t('pages.home.stats.empty')}
        </p>
      )}
    </section>
  );
}

export function Home() {
  const { t } = useTranslation();
  const [hasAuthToken, setHasAuthToken] = useState(() =>
    Boolean(authService.getAuthToken()),
  );
  const [playerStats, setPlayerStats] = useState(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY) || 'en';

  const loadPlayerStats = useCallback(async () => {
    const token = authService.getAuthToken();

    setHasAuthToken(Boolean(token));

    if (!token) {
      setPlayerStats(null);
      setStatsError('');
      return;
    }

    setIsStatsLoading(true);
    setStatsError('');

    try {
      setPlayerStats(await getMyStats());
    } catch (error) {
      setStatsError(error.message || t('pages.home.stats.loadError'));
    } finally {
      setIsStatsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadPlayerStats();
  }, [loadPlayerStats]);

  const handleProfileSaved = useCallback(() => {
    void loadPlayerStats();
  }, [loadPlayerStats]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-stone-100">
      <img src={gameTableBg} alt="" className="absolute inset-0 size-full object-cover" draggable="false" />
      <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(0,0,0,0.9),rgba(0,0,0,0.38)_58%,rgba(0,0,0,0.75))]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/80 to-transparent" />

      <div className="relative z-20 mx-4 mt-16 sm:mx-6 md:mt-4 lg:absolute lg:right-6 lg:top-5 lg:m-0 lg:w-[17rem]">
        <LoginCard compact defaultMinimized minimizable className="w-full" onSaved={handleProfileSaved} />
      </div>

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-[92rem] flex-col justify-center px-4 py-24 sm:px-6 lg:px-8 lg:py-8">
        <div className="relative w-full max-w-[46rem] rounded-lg border border-white/15 bg-black/62 px-5 py-4 shadow-2xl shadow-black/40 backdrop-blur md:px-7">
          <h1 className="mt-7 hidden h-32 w-full overflow-hidden md:block">
            <VideoText key={storedLanguage} src={gameBg} fontSize={storedLanguage.startsWith('en') ? 20 : 22} fontWeight="900" className="block size-full drop-shadow-2xl" as="span">
              {t('common.appNameShort')}
            </VideoText>
          </h1>
          
          <div className="pointer-events-none absolute left-[calc(100%+1.5rem)] top-1/2 hidden h-48 w-60 -translate-y-1/2 lg:block" aria-hidden="true">
            <img src={card1Espada8Bit} alt="" className="absolute left-3 top-6 z-10 h-36 w-auto -rotate-[14deg] rounded shadow-2xl shadow-black/60" draggable="false" />
            <img src={card12Copas8Bit} alt="" className="absolute right-3 top-6 z-10 h-36 w-auto rotate-[14deg] rounded shadow-2xl shadow-black/60" draggable="false" />
            <img src={card3Paus8Bit} alt="" className="absolute left-1/2 top-2 z-20 h-40 w-auto -translate-x-1/2 rounded shadow-2xl shadow-black/70" draggable="false" />
          </div>
        </div>

        <div className="mt-4 w-full max-w-[46rem] rounded-lg border border-white/15 bg-black/62 px-5 py-4 shadow-xl shadow-black/35 backdrop-blur md:px-7">
          <p className="text-base font-semibold leading-7 text-stone-300 md:text-lg md:leading-8">{t('pages.home.tagline')}</p>
        </div>

        <nav className="mt-7 grid w-full gap-3 sm:grid-cols-2 lg:max-w-[68.1rem] lg:grid-cols-5">
          {homeActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.path} to={action.path} className="group flex min-h-24 items-center justify-between rounded-lg border border-white/15 bg-black/62 px-4 py-4 shadow-xl shadow-black/35 backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-amber-300/55 hover:bg-emerald-950/70 focus:outline-none focus:ring-2 focus:ring-amber-300">
                <span className="text-lg font-black text-white">{t(action.labelKey)}</span>
                <span className="grid size-10 shrink-0 place-items-center rounded-md border border-amber-200/20 bg-emerald-950/65 text-amber-200 transition group-hover:bg-amber-300 group-hover:text-black"><Icon className="size-5" /></span>
              </Link>
            );
          })}
          <button type="button" className="group flex min-h-24 cursor-pointer items-center justify-between rounded-lg border border-white/15 bg-black/62 px-4 py-4 text-left shadow-xl shadow-black/35 backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-amber-300/55 hover:bg-emerald-950/70 focus:outline-none focus:ring-2 focus:ring-amber-300" onClick={() => setIsSettingsOpen(true)}>
            <span className="text-lg font-black text-white">{t('settings.title')}</span>
            <span className="grid size-10 shrink-0 place-items-center rounded-md border border-amber-200/20 bg-emerald-950/65 text-amber-200 transition group-hover:bg-amber-300 group-hover:text-black"><Settings className="size-5" /></span>
          </button>
        </nav>
      </section>

      {hasAuthToken ? (
        <div className="relative z-20 mx-4 mb-4 sm:mx-6 lg:absolute lg:bottom-5 lg:right-6 lg:m-0 lg:w-[22rem]">
          <PlayerStatsPanel error={statsError} isLoading={isStatsLoading} stats={playerStats} t={t} />
        </div>
      ) : null}

      <GameSettingsModal open={isSettingsOpen} onOpenChange={setIsSettingsOpen} variant="classic" />
    </main>
  );
}
