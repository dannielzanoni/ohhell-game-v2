import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import card1Ouro from '@/assets/cards/spanish/1ouro.jpg';
import card2Espada from '@/assets/cards/spanish/2espada.jpg';
import card3Paus from '@/assets/cards/spanish/3paus.jpg';
import frenchCard1Ouro from '@/assets/cards/french/1ouro.png';
import frenchCard2Espada from '@/assets/cards/french/2espada.png';
import frenchCard3Paus from '@/assets/cards/french/3paus.png';
import gameBg from '@/assets/videos/game-bg.mp4';
import { LoginCard } from '@/components/auth/LoginCard.jsx';
import { VideoText } from '@/components/ui/video-text.jsx';
import { cn } from '@/lib/utils.js';
import { authService } from '@/services/authService.js';
import { getMyStats } from '@/services/statsService.js';
import { pageLinks } from '../pageLinks.js';

const cardGroups = [
  {
    title: 'Spanish',
    cards: [
      { src: card1Ouro, label: '1 de ouro espanhol' },
      { src: card2Espada, label: '2 de espada espanhol' },
      { src: card3Paus, label: '3 de paus espanhol' },
    ],
  },
  {
    title: 'French',
    cards: [
      { src: frenchCard1Ouro, label: '1 de ouro frances' },
      { src: frenchCard2Espada, label: '2 de espada frances' },
      { src: frenchCard3Paus, label: '3 de paus frances' },
    ],
  },
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
    <section className="rounded-lg border border-border bg-card p-6 shadow-sm lg:p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        {t('pages.home.stats.eyebrow')}
      </p>
      <h2 className="mt-2 text-lg font-black tracking-tight text-foreground">
        {t('pages.home.stats.title')}
      </h2>

      {isLoading ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-16 animate-pulse rounded-md bg-muted" />
          ))}
        </div>
      ) : error ? (
        <p className="mt-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm leading-5 text-destructive">
          {error}
        </p>
      ) : stats ? (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {playerStatItems.map((item) => (
            <div key={item.labelKey} className="rounded-md bg-muted px-3 py-2">
              <span className="block text-xs font-semibold text-muted-foreground">
                {t(item.labelKey)}
              </span>
              <strong className="mt-1 block text-xl font-black text-foreground">
                {item.getValue(stats)}
              </strong>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
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
  const mobileTitleSecondLine = t('common.appNameShort2');
  const hasMobileTitleSecondLine = mobileTitleSecondLine.trim().length > 0;

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
    <main className="min-h-screen overflow-hidden px-4 py-6 md:px-6 lg:h-screen lg:px-6 lg:py-5">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:h-full lg:max-w-7xl lg:gap-5">
        <div className="relative overflow-hidden rounded-lg border border-border bg-card p-6 shadow-sm md:p-8 lg:p-5">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.2),transparent_35%),radial-gradient(circle_at_bottom_left,rgba(14,165,233,0.18),transparent_30%)]" />
          <div className="relative">
            <div className="relative mt-3 hidden h-36 w-full overflow-hidden md:block lg:h-32 xl:h-42">
              <VideoText
                src={gameBg}
                fontSize={13}
                fontWeight="900"
                className="drop-shadow-2xl"
              >
                {t('common.appName')}
              </VideoText>
            </div>
            <div className="relative mt-8 grid gap-1 md:hidden">
              <div className="h-24 overflow-hidden">
                <VideoText
                  src={gameBg}
                  fontSize={24}
                  fontWeight="900"
                  className="drop-shadow-2xl"
                >
                  {t('common.appNameShort')}
                </VideoText>
              </div>
              {hasMobileTitleSecondLine ? (
                <div className="h-24 overflow-hidden">
                  <VideoText
                    src={gameBg}
                    fontSize={32}
                    fontWeight="900"
                    className="drop-shadow-2xl"
                  >
                    {mobileTitleSecondLine}
                  </VideoText>
                </div>
              ) : null}
            </div>
            <p className="mt-4 w-full max-w-none text-base leading-7 text-muted-foreground md:text-lg md:leading-8 lg:mt-3 lg:text-base lg:leading-6">
              {t('pages.home.tagline')}
            </p>

            <section className="mt-4 rounded-lg border border-border bg-background/55 p-4 shadow-lg shadow-black/10 backdrop-blur lg:mt-4 lg:p-3">
              <div className="grid gap-4 md:grid-cols-2 lg:gap-3">
                {cardGroups.map((group) => (
                  <div
                    key={group.title}
                    className="overflow-hidden px-4 pt-1"
                  >
                    <div className="flex h-[8.5rem] items-start justify-center px-2 pt-2 md:h-34 lg:h-28 xl:h-32">
                      {group.cards.map((card, index) => (
                        <img
                          key={card.label}
                          src={card.src}
                          alt={card.label}
                          className="relative mt-1 h-[12.65rem] w-[8.05rem] shrink-0 rounded-[8%] border border-black bg-card object-cover shadow-xl transition duration-200 hover:z-20 hover:-translate-y-5 hover:rotate-0 hover:scale-105 hover:shadow-2xl lg:h-[10.35rem] lg:w-[6.9rem] xl:h-[11.5rem] xl:w-[7.5rem]"
                          style={{
                            marginLeft: index === 0 ? 0 : '-2.75rem',
                            rotate: `${(index - 1) * 4.4}deg`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:items-start lg:gap-5">
          <LoginCard className="lg:p-5" onSaved={handleProfileSaved} />

          <nav className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-3">
            {pageLinks.map((page) => {
              const Icon = page.icon;
              const label = page.labelKey ? t(page.labelKey) : page.label;
              const description = page.descriptionKey
                ? t(page.descriptionKey)
                : page.description;
              const content = (
                <>
                  <span className="flex items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-md bg-secondary text-secondary-foreground transition group-hover:bg-primary group-hover:text-primary-foreground lg:size-9">
                      {Icon ? (
                        <Icon className="size-5 lg:size-4" />
                      ) : page.primeIcon ? (
                        <i className={cn(page.primeIcon, 'text-lg lg:text-base')} />
                      ) : (
                        <img
                          src={page.iconSrc}
                          alt=""
                          className="size-5 object-contain lg:size-4"
                        />
                      )}
                    </span>
                    <span className="text-xl font-bold text-foreground lg:text-base">
                      {label}
                    </span>
                  </span>
                  <span className="mt-4 block text-sm leading-6 text-muted-foreground lg:mt-3 lg:text-xs lg:leading-5">
                    {description}
                  </span>
                </>
              );

              if (page.externalUrl) {
                return (
                  <a
                    key={page.path}
                    href={page.externalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group rounded-lg border border-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background lg:p-4"
                  >
                    {content}
                  </a>
                );
              }

              return (
                <Link
                  key={page.path}
                  to={page.path}
                  className="group rounded-lg border border-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background lg:p-4"
                >
                  {content}
                </Link>
              );
            })}
          </nav>

          {hasAuthToken ? (
            <div className="lg:col-span-2">
              <PlayerStatsPanel
                error={statsError}
                isLoading={isStatsLoading}
                stats={playerStats}
                t={t}
              />
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
