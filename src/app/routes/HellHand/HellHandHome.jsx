import {
  GalleryVerticalEnd,
  Play,
  Settings,
  UserRound,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import hellHandBg from '@/assets/backgrounds/hell-hand-bg.avif';
import luaIcon from '@/assets/icons/hell-hand/Lua-Dark.svg';
import selectMenuSound from '@/assets/sounds/hell-hand/ui/select_menu.mp3';
import hellHandTitleVideo from '@/assets/videos/hell-hand-bg.mp4';
import { GameSettingsModal } from '@/components/settings/GameSettingsModal.jsx';
import { VideoText } from '@/components/ui/video-text.jsx';
import { getGamePreferences } from '@/services/gamePreferencesService.js';
import {
  startHellHandHomeTheme,
  stopHellHandHomeTheme,
} from '@/services/hellHandAudioService.js';

const actions = [
  {
    id: 'play',
    icon: Play,
    labelKey: 'pages.hellHandHome.actions.play',
    path: '/hell-hand/game',
    type: 'play',
  },
  {
    icon: Users,
    labelKey: 'pages.hellHandHome.actions.rooms',
    path: '/rooms',
  },
  {
    icon: UserRound,
    labelKey: 'pages.hellHandHome.actions.mercenaries',
    path: '/hell-hand/mercenaries',
    type: 'transition',
  },
  {
    icon: GalleryVerticalEnd,
    labelKey: 'pages.hellHandHome.actions.cards',
    path: '/power-decks',
  },
  {
    id: 'settings',
    icon: Settings,
    labelKey: 'pages.hellHandHome.actions.settings',
    type: 'settings',
  },
];

function playSelectSound() {
  const volume = getGamePreferences().volume / 100;

  if (volume <= 0) {
    return;
  }

  const audio = new Audio(selectMenuSound);
  audio.volume = volume;
  audio.play().catch(() => {});
}

export function HellHandHome() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [transitionPath, setTransitionPath] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const isTransitioning = Boolean(transitionPath);

  useEffect(() => {
    startHellHandHomeTheme();
  }, []);

  const handleHellHandTransition = (path) => {
    if (isTransitioning) {
      return;
    }

    playSelectSound();
    setTransitionPath(path);
    window.setTimeout(() => {
      navigate(path);
    }, 520);
  };

  const handleMenuSelection = () => {
    playSelectSound();
    stopHellHandHomeTheme();
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-stone-100">
      <div
        className={`absolute inset-0 transition duration-700 ${
          isTransitioning ? 'scale-125 opacity-0 blur-sm' : 'scale-100 opacity-100 blur-0'
        }`}
      >
        <img
          src={hellHandBg}
          alt=""
          className="absolute inset-0 size-full object-cover"
          draggable="false"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(185,28,28,0.24),transparent_32%),linear-gradient(110deg,rgba(0,0,0,0.92),rgba(24,10,10,0.74)_48%,rgba(0,0,0,0.94))]" />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/70 to-transparent" />
      </div>

      <section
        className={`relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-4 py-8 transition duration-700 sm:px-6 lg:px-8 ${
          isTransitioning ? 'scale-125 opacity-0 blur-sm' : 'scale-100 opacity-100 blur-0'
        }`}
      >
        <div className="max-w-3xl">
          <div className="mt-5 w-full max-w-[44rem] rounded-lg border border-red-200/12 bg-black/52 px-4 py-2 shadow-xl shadow-black/30 backdrop-blur sm:px-5 md:px-6 md:py-3">
            <h1 className="h-20 w-full overflow-hidden sm:h-24 md:h-35 lg:h-35">
              <VideoText
                src={hellHandTitleVideo}
                fontSize={19}
                fontWeight="900"
                className="block size-full drop-shadow-2xl mt-3"
                as="span"
              >
                {t('pages.hellHandHome.title')}
              </VideoText>
            </h1>
          </div>

          <div className="mt-5 w-full max-w-[44rem] rounded-lg border border-red-200/12 bg-black/52 px-4 py-3 shadow-xl shadow-black/30 backdrop-blur sm:px-5">
            <p className="text-lg font-semibold leading-8 text-stone-300">
              {t('pages.hellHandHome.description')}
            </p>
            <p className="mt-1 flex items-center gap-2 text-lg font-semibold leading-8 text-red-100">
              <span className="text-lg font-semibold leading-8">
                {t('pages.hellHandHome.luaIntegration').trim()}
              </span>
              <img
                src={luaIcon}
                alt=""
                aria-hidden="true"
                className="size-6 shrink-0 md:size-7"
                draggable="false"
              />
            </p>
          </div>
        </div>

        <nav className="mt-8 grid w-full max-w-5xl gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {actions.map((action) => {
            const Icon = action.icon;
            const content = (
              <>
                <span className="text-lg font-black text-stone-100">
                  {t(action.labelKey)}
                </span>
                <span className="grid size-10 place-items-center rounded-md border border-amber-200/15 bg-amber-950/35 text-amber-200 transition group-hover:bg-amber-300 group-hover:text-black">
                  <Icon className="size-5" />
                </span>
              </>
            );

            if (action.type === 'play' || action.type === 'transition') {
              return (
                <button
                  key={action.id ?? action.path}
                  type="button"
                  className="group flex min-h-24 cursor-pointer items-center justify-between rounded-lg border border-red-200/12 bg-black/52 px-4 py-4 text-left shadow-xl shadow-black/30 backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-amber-300/50 hover:bg-red-950/50 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  onClick={() => handleHellHandTransition(action.path)}
                >
                  {content}
                </button>
              );
            }

            if (action.type === 'settings') {
              return (
                <button
                  key={action.id}
                  type="button"
                  className="group flex min-h-24 cursor-pointer items-center justify-between rounded-lg border border-red-200/12 bg-black/52 px-4 py-4 text-left shadow-xl shadow-black/30 backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-amber-300/50 hover:bg-red-950/50 focus:outline-none focus:ring-2 focus:ring-amber-300"
                  onClick={() => setIsSettingsOpen(true)}
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={action.path}
                to={action.path}
                className="group flex min-h-24 items-center justify-between rounded-lg border border-red-200/12 bg-black/52 px-4 py-4 text-left shadow-xl shadow-black/30 backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-amber-300/50 hover:bg-red-950/50 focus:outline-none focus:ring-2 focus:ring-amber-300"
                onClick={handleMenuSelection}
              >
                {content}
              </Link>
            );
          })}
        </nav>

      </section>

      <GameSettingsModal
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        variant="hellHand"
      />
    </main>
  );
}
