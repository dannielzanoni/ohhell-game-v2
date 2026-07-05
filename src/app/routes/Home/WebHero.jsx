import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import gamePoster from '@/assets/backgrounds/game-table-bg.png';
import gameBg from '@/assets/videos/game-bg.mp4';
import { VideoText } from '@/components/ui/video-text.jsx';
import { routePaths } from '../routeContract.js';

export function WebHero() {
  const { t } = useTranslation();

  return (
    <section className="hidden md:block" aria-labelledby="web-hero-title">
      <h1 id="web-hero-title" className="sr-only">{t('common.appName')}</h1>
      <div className="relative mt-2 h-32 w-full overflow-hidden xl:h-40">
        <VideoText
          src={gameBg}
          poster={gamePoster}
          fontSize={13}
          fontWeight="900"
          className="drop-shadow-2xl"
        >
          {t('common.appName')}
        </VideoText>
      </div>
      <div className="mt-2 flex items-center justify-between gap-4">
        <p className="max-w-3xl text-base leading-6 text-muted-foreground">
          {t('pages.home.tagline')}
        </p>
        <div className="flex shrink-0 gap-2">
          <Link className="inline-flex min-h-11 items-center rounded-md bg-primary px-4 font-bold text-primary-foreground" to={routePaths.createGame}>
            {t('common.play')}
          </Link>
          <Link className="inline-flex min-h-11 items-center rounded-md border border-border px-4 font-bold" to={routePaths.rooms}>
            {t('pages.links.rooms.label')}
          </Link>
        </div>
      </div>
    </section>
  );
}
