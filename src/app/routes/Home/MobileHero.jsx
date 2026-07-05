import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import gamePoster from '@/assets/backgrounds/game-table-bg.png';
import gameBg from '@/assets/videos/game-bg.mp4';
import { VideoText } from '@/components/ui/video-text.jsx';
import { useOptionalMedia } from '@/platform/useOptionalMedia.js';
import { routePaths } from '../routeContract.js';

export function MobileHero() {
  const { t } = useTranslation();
  const { shouldLoadOptionalMedia } = useOptionalMedia();

  return (
    <section className="md:hidden" aria-labelledby="mobile-hero-title">
      <h1 id="mobile-hero-title" className="sr-only">
        {t('common.appName')}
      </h1>
      <div className="mt-2 h-28 w-full overflow-hidden" data-media-mode={shouldLoadOptionalMedia ? 'video' : 'poster'}>
        <VideoText
          src={gameBg}
          poster={gamePoster}
          videoEnabled={shouldLoadOptionalMedia}
          fontSize={18}
          fontWeight="900"
          className="drop-shadow-2xl"
        >
          {t('common.appName')}
        </VideoText>
      </div>
      <p className="mt-3 text-base leading-7 text-muted-foreground">
        {t('pages.home.tagline')}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 font-bold text-primary-foreground"
          to={routePaths.createGame}
        >
          {t('common.play')}
        </Link>
        <Link
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-background/60 px-4 font-bold"
          to={routePaths.rooms}
        >
          {t('pages.links.rooms.label')}
        </Link>
      </div>
    </section>
  );
}
