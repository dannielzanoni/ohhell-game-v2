import { useEffect, useState } from 'react';
import {
  Code2,
  GalleryVerticalEnd,
  House,
  Layers3,
  Wrench,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import hellHandBg from '@/assets/hell_hand/backgrounds/hell-hand-bg.avif';
import { Playground } from '@/app/routes/Playground/Playground.jsx';
import { PowerDecks } from '@/app/routes/PowerDecks/PowerDecks.jsx';
import { Button } from '@/components/ui/button.jsx';
import { cn } from '@/lib/utils.js';
import { startHellHandHomeTheme } from '@/services/hellHandAudioService.js';

const workshopTabs = [
  {
    descriptionKey: 'pages.hellHandWorkshop.cardsDescription',
    icon: GalleryVerticalEnd,
    id: 'cards',
    labelKey: 'pages.hellHandWorkshop.cards',
  },
  {
    descriptionKey: 'pages.hellHandWorkshop.playgroundDescription',
    icon: Code2,
    id: 'playground',
    labelKey: 'pages.hellHandWorkshop.playground',
  },
  {
    descriptionKey: 'pages.hellHandWorkshop.powerDecksDescription',
    icon: Layers3,
    id: 'powerDecks',
    labelKey: 'pages.hellHandWorkshop.powerDecks',
  },
];

function WorkshopPanel({ activeTab, t }) {
  const Icon = activeTab.icon;
  const isEmbeddedPage =
    activeTab.id === 'playground' || activeTab.id === 'powerDecks';

  return (
    <section
      className={cn(
        'flex min-h-[22rem] flex-col rounded-lg border border-red-200/12 bg-black/68 shadow-2xl shadow-black/35 backdrop-blur lg:min-h-0 lg:flex-1',
        isEmbeddedPage
          ? 'overflow-y-auto p-3 sm:p-4'
          : 'overflow-hidden p-5',
      )}
    >
      {!isEmbeddedPage ? (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <span className="grid size-12 place-items-center rounded-md border border-amber-200/15 bg-amber-950/35 text-amber-200">
              <Icon className="size-6" />
            </span>
            <h2 className="mt-4 text-3xl font-black text-white">
              {t(activeTab.labelKey)}
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-stone-300">
              {t(activeTab.descriptionKey)}
            </p>
          </div>
        </div>
      ) : null}

      {activeTab.id === 'playground' ? (
        <Playground embedded variant="hellHand" />
      ) : null}

      {activeTab.id === 'powerDecks' ? (
        <PowerDecks embedded variant="hellHand" />
      ) : null}

      {activeTab.id === 'cards' ? (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-red-200/12 bg-black/55 p-4">
            <p className="text-xs font-black uppercase text-amber-300/70">
              {t('pages.hellHandWorkshop.officialCards')}
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-stone-300">
              {t('pages.hellHandWorkshop.officialCardsDescription')}
            </p>
          </div>
          <div className="rounded-lg border border-red-200/12 bg-black/55 p-4">
            <p className="text-xs font-black uppercase text-amber-300/70">
              {t('pages.hellHandWorkshop.communityCards')}
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-stone-300">
              {t('pages.hellHandWorkshop.communityCardsDescription')}
            </p>
          </div>
        </div>
      ) : null}

    </section>
  );
}

export function HellHandWorkshop() {
  const { t } = useTranslation();
  const [activeTabId, setActiveTabId] = useState(workshopTabs[0].id);
  const activeTab =
    workshopTabs.find((tab) => tab.id === activeTabId) || workshopTabs[0];

  useEffect(() => {
    startHellHandHomeTheme();
  }, []);

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black px-0 py-5 text-stone-100 lg:h-dvh lg:min-h-0 lg:overflow-hidden lg:py-4">
      <img
        src={hellHandBg}
        alt=""
        className="absolute inset-0 size-full scale-105 object-cover"
        draggable="false"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(185,28,28,0.28),transparent_34%),linear-gradient(115deg,rgba(0,0,0,0.94),rgba(36,10,10,0.78)_48%,rgba(0,0,0,0.96))]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/70 to-transparent" />

      <section className="relative z-10 mx-auto flex w-[95%] max-w-none flex-col gap-2 lg:h-full lg:min-h-0">
        <header className="rounded-lg border border-red-200/12 bg-black/70 p-4 shadow-2xl shadow-black/35 backdrop-blur lg:shrink-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="mt-1 flex items-center gap-3 text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-3xl">
                <Wrench className="size-8 text-amber-200" />
                {t('pages.hellHandWorkshop.title')}
              </h1>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-stone-300">
                {t('pages.hellHandWorkshop.description')}
              </p>
            </div>

            <Button
              asChild
              variant="outline"
              className="h-10 cursor-pointer gap-2 border-red-200/20 bg-black/55 text-stone-100 hover:border-amber-300/45 hover:bg-red-950/55 hover:text-amber-100"
            >
              <Link to="/hell-hand">
                <House className="size-4" />
                Home
              </Link>
            </Button>
          </div>
        </header>

        <nav className="grid gap-2 rounded-lg border border-red-200/12 bg-black/68 p-2 shadow-2xl shadow-black/35 backdrop-blur sm:grid-cols-2 lg:grid-cols-3">
          {workshopTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab.id;

            return (
              <button
                key={tab.id}
                type="button"
                className={cn(
                  'group flex min-h-16 cursor-pointer items-center gap-3 rounded-md border px-3 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-amber-300',
                  isActive
                    ? 'border-amber-300/55 bg-red-950/65 text-white shadow-lg shadow-black/30'
                    : 'border-red-200/10 bg-black/45 text-stone-300 hover:border-amber-300/35 hover:bg-red-950/35',
                )}
                onClick={() => setActiveTabId(tab.id)}
              >
                <span
                  className={cn(
                    'grid size-10 shrink-0 place-items-center rounded-md border transition',
                    isActive
                      ? 'border-amber-200/35 bg-amber-300 text-black'
                      : 'border-amber-200/15 bg-amber-950/35 text-amber-200 group-hover:bg-amber-300 group-hover:text-black',
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-base font-black">
                    {t(tab.labelKey)}
                  </span>
                  <span className="mt-0.5 block text-xs font-semibold text-stone-400">
                    ({t(tab.descriptionKey)})
                  </span>
                </span>
              </button>
            );
          })}
        </nav>

        <WorkshopPanel activeTab={activeTab} t={t} />
      </section>
    </main>
  );
}
