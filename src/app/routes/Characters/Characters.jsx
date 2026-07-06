import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import TiltedCard from '@/components/ui/TiltedCard.jsx';
import { cn } from '@/lib/utils.js';
import { mercenaries } from './characterData.js';

function getCarouselOffset(index, activeIndex, length) {
  let offset = index - activeIndex;

  if (offset > length / 2) {
    offset -= length;
  }

  if (offset < -length / 2) {
    offset += length;
  }

  return offset;
}

function CharacterCard({ character, isActive, onSelect, offset, t }) {
  const title = t(`pages.characters.items.${character.id}.title`);
  const subtitle = t(`pages.characters.items.${character.id}.subtitle`);
  const xOffset =
    offset === 0
      ? '0rem'
      : offset > 0
        ? 'clamp(9.5rem, 20vw, 18rem)'
        : 'clamp(-18rem, -20vw, -9.5rem)';

  return (
    <article
      aria-current={isActive}
      className={cn(
        'absolute left-1/2 top-1/2 h-[20.5rem] w-[min(92vw,41rem)] cursor-pointer rounded-lg outline-none transition duration-300 focus-visible:ring-3 focus-visible:ring-ring/50 sm:h-[24rem] sm:w-[43rem] lg:h-[calc(100%-1.25rem)] lg:max-h-[24rem] lg:w-[min(68vw,46rem)]',
        isActive ? 'opacity-100' : 'opacity-55 hover:opacity-80',
      )}
      style={{
        transform: `translate(calc(-50% + ${xOffset}), -50%) rotate(${offset * -5}deg) scale(${isActive ? 1 : 0.82})`,
        zIndex: isActive ? 20 : 10 - Math.abs(offset),
      }}
    >
      <button
        type="button"
        className="block size-full cursor-pointer rounded-lg text-left outline-none"
        onClick={onSelect}
      >
        <TiltedCard
          imageSrc={character.banner}
          altText={title}
          captionText={title}
          containerHeight="100%"
          containerWidth="100%"
          imageHeight="100%"
          imageWidth="100%"
          rotateAmplitude={isActive ? 11 : 4}
          scaleOnHover={isActive ? 1.04 : 1}
          showMobileWarning={false}
          showTooltip={false}
          displayOverlayContent
          overlayContent={
            <div className="relative flex size-full flex-col justify-between overflow-hidden rounded-lg border border-white/15 p-4 text-left text-white shadow-2xl shadow-black/35 sm:p-5">
              <div
                className={cn(
                  'absolute inset-0 bg-gradient-to-br',
                  character.accentClass,
                )}
              />
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/88 via-black/42 to-transparent" />
              <div />
              <div className="relative">
                <span
                  className={cn(
                    'mb-2 block h-1.5 w-14 rounded-full sm:mb-3',
                    character.markerClass,
                  )}
                />
                <h2 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                  {title}
                </h2>
                <p className="mt-2 max-w-[24rem] text-sm font-semibold leading-5 text-white/78 sm:leading-6">
                  {subtitle}
                </p>
              </div>
            </div>
          }
        />
      </button>
      {isActive ? (
        <Button
          asChild
          className="absolute bottom-4 right-4 z-30 h-10 cursor-pointer gap-2 bg-white text-black hover:bg-white/85"
        >
          <Link to={character.path}>
            <Eye className="size-4" />
            {t('pages.characters.inspect')}
          </Link>
        </Button>
      ) : null}
    </article>
  );
}

export function Mercenaries() {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);

  const goToPrevious = () => {
    setActiveIndex((current) =>
      current === 0 ? mercenaries.length - 1 : current - 1,
    );
  };

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % mercenaries.length);
  };

  return (
    <main className="min-h-screen bg-background px-4 py-5 text-foreground md:px-6 lg:h-screen lg:overflow-hidden lg:py-4">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-4 lg:h-full lg:min-h-0">
        <header className="rounded-lg border border-border bg-card p-4 shadow-sm lg:shrink-0">
          <p className="text-sm font-semibold uppercase text-primary">
            {t('pages.characters.eyebrow')}
          </p>
          <div className="mt-2 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-3xl">
                {t('pages.characters.title')}
              </h1>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-muted-foreground lg:leading-5">
                {t('pages.characters.description')}
              </p>
            </div>
            <div className="flex gap-2 rounded-lg border border-border bg-background p-2">
              {mercenaries.map((character, index) => (
                <button
                  key={character.id}
                  type="button"
                  aria-label={t('pages.characters.chooseCharacter', {
                    name: t(`pages.characters.items.${character.id}.title`),
                  })}
                  className={cn(
                    'size-2.5 rounded-full transition',
                    activeIndex === index
                      ? character.markerClass
                      : 'bg-muted-foreground/35 hover:bg-muted-foreground/65',
                  )}
                  onClick={() => setActiveIndex(index)}
                />
              ))}
            </div>
          </div>
        </header>

        <div className="grid gap-4 lg:min-h-0 lg:flex-1">
          <section className="flex flex-col rounded-lg border border-border bg-card p-4 shadow-sm lg:min-h-0">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  {t('pages.characters.carouselEyebrow')}
                </p>
                <h2 className="text-xl font-black lg:text-lg">
                  {t('pages.characters.carouselTitle')}
                </h2>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-lg"
                  aria-label={t('pages.characters.previous')}
                  className="cursor-pointer"
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-lg"
                  aria-label={t('pages.characters.next')}
                  className="cursor-pointer"
                  onClick={goToNext}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            <div className="relative mt-3 h-[34rem] overflow-hidden rounded-lg border border-border bg-background sm:h-[38rem] lg:min-h-0 lg:flex-1">
              {mercenaries.map((character, index) => {
                const offset = getCarouselOffset(
                  index,
                  activeIndex,
                  mercenaries.length,
                );

                return (
                  <CharacterCard
                    key={character.id}
                    character={character}
                    isActive={index === activeIndex}
                    offset={offset}
                    t={t}
                    onSelect={() => setActiveIndex(index)}
                  />
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
