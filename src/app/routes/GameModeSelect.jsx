import { Flame, Swords } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import classicBg from '@/assets/classic/backgrounds/game-table-bg.png';
import hellHandBg from '@/assets/hell_hand/backgrounds/hell-hand-bg.avif';
import { cn } from '@/lib/utils.js';

const gameModes = [
  {
    accentClass: 'from-emerald-900/70 via-black/45 to-yellow-900/55',
    descriptionKey: 'pages.gameModeSelect.classic.description',
    icon: Swords,
    image: classicBg,
    labelKey: 'pages.gameModeSelect.classic.title',
    path: '/home',
  },
  {
    accentClass: 'from-red-950/80 via-black/55 to-stone-950/80',
    descriptionKey: 'pages.gameModeSelect.hellHand.description',
    icon: Flame,
    image: hellHandBg,
    labelKey: 'pages.gameModeSelect.hellHand.title',
    path: '/hell-hand',
  },
];

function ModeCard({ mode, t }) {
  const Icon = mode.icon;

  return (
    <Link
      to={mode.path}
      className="group relative flex min-h-[18rem] overflow-hidden rounded-lg border border-white/12 bg-black text-white shadow-2xl shadow-black/30 outline-none transition duration-300 hover:-translate-y-1 hover:border-amber-300/50 hover:shadow-amber-950/30 focus-visible:ring-2 focus-visible:ring-amber-300 md:min-h-[24rem]"
    >
      <img
        src={mode.image}
        alt=""
        className="absolute inset-0 size-full object-cover transition duration-500 group-hover:scale-105"
        draggable="false"
      />
      <div className={cn('absolute inset-0 bg-gradient-to-br', mode.accentClass)} />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/60 to-transparent" />

      <div className="relative z-10 flex min-h-full w-full flex-col justify-between p-5 sm:p-6">
        <span className="grid size-11 place-items-center rounded-md border border-white/15 bg-black/45 text-amber-200 backdrop-blur">
          <Icon className="size-5" />
        </span>

        <span>
          <span className="block text-3xl font-black tracking-tight md:text-5xl">
            {t(mode.labelKey)}
          </span>
          <span className="mt-3 block max-w-md text-sm font-semibold leading-6 text-white/72 md:text-base md:leading-7">
            {t(mode.descriptionKey)}
          </span>
        </span>
      </div>
    </Link>
  );
}

export function GameModeSelect() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen overflow-hidden bg-stone-950 px-4 py-6 text-white sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col justify-center gap-6">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-300/80">
            {t('pages.gameModeSelect.eyebrow')}
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl md:text-7xl">
            {t('pages.gameModeSelect.title')}
          </h1>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {gameModes.map((mode) => (
            <ModeCard key={mode.path} mode={mode} t={t} />
          ))}
        </div>
      </section>
    </main>
  );
}
