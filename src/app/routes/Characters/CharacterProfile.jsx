import { useEffect, useState } from 'react';
import { ArrowLeft, Info } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button.jsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.jsx';
import { cn } from '@/lib/utils.js';
import { getMercenaries } from '@/services/mercenariesService.js';
import {
  findMercenary,
  getMercenarySubtitle,
  getMercenaryTitle,
  mercenaries,
  mergeMercenaries,
} from './characterData.js';

function CardArtwork({ card, title, markerClass, className }) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-border bg-background shadow-inner',
        className,
      )}
    >
      {card.image ? (
        <img
          src={card.image}
          alt={title}
          className="aspect-[768/1344] size-full object-cover"
          draggable="false"
        />
      ) : (
        <div className="relative min-h-52 p-4">
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-primary/12 to-transparent" />
          <span className={cn('relative block h-1.5 w-12 rounded-full', markerClass)} />
          <div className="relative mt-12">
            <h3 className="text-2xl font-black leading-none">
              {title}
            </h3>
          </div>
        </div>
      )}
    </div>
  );
}

function AbilityCard({ card, characterId, markerClass, t }) {
  const title = t(`pages.characters.items.${characterId}.cards.${card.id}.title`);
  const description = t(
    `pages.characters.items.${characterId}.cards.${card.id}.description`,
  );
  const story = t(`pages.characters.items.${characterId}.cards.${card.id}.story`);

  return (
    <Dialog>
      <article className="relative w-full max-w-[16.5rem] overflow-hidden rounded-lg border border-border bg-card p-2 shadow-sm">
        <CardArtwork card={card} title={title} markerClass={markerClass} />
        <DialogTrigger asChild>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            aria-label={t('pages.characters.cardInfo', { name: title })}
            className="absolute bottom-4 left-4 z-10 size-7 cursor-pointer rounded-full bg-background/90 shadow-lg backdrop-blur"
          >
            <Info className="size-3.5" />
          </Button>
        </DialogTrigger>
      </article>

      <DialogContent className="sm:max-w-4xl">
        <div className="grid gap-5 md:grid-cols-[minmax(0,16.5rem)_1fr]">
          <CardArtwork
            card={card}
            title={title}
            markerClass={markerClass}
            className="mx-auto w-full max-w-[16.5rem]"
          />

          <div className="grid content-start gap-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">
                {title}
              </DialogTitle>
              <DialogDescription>
                {description}
              </DialogDescription>
            </DialogHeader>

            <div className="rounded-lg border border-border bg-muted/40 p-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                {t('pages.characters.manaCost')}
              </p>
              <p className="mt-1 text-2xl font-black text-foreground">
                {card.manaCost}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                {t('pages.characters.cardStory')}
              </p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {story}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function CharacterProfile({ characterId }) {
  const { t } = useTranslation();
  const [characters, setCharacters] = useState(mercenaries);

  useEffect(() => {
    let isActive = true;

    async function loadMercenaries() {
      try {
        const response = await getMercenaries();

        if (isActive) {
          setCharacters(mergeMercenaries(Array.isArray(response) ? response : []));
        }
      } catch {
        if (isActive) {
          setCharacters(mercenaries);
        }
      }
    }

    void loadMercenaries();

    return () => {
      isActive = false;
    };
  }, []);

  const character = findMercenary(characterId, characters);

  if (!character) {
    return <Navigate to="/mercenaries" replace />;
  }

  const title = getMercenaryTitle(character, t);
  const subtitle = getMercenarySubtitle(character, t);
  const history = character.description || t(`pages.characters.items.${character.id}.history`);
  const statRows = [
    [t('pages.characters.stats.deck'), character.deck || t(`pages.characters.items.${character.id}.deck`)],
    [t('pages.characters.stats.style'), character.style || t(`pages.characters.items.${character.id}.style`)],
    [t('pages.characters.stats.temper'), character.temper || t(`pages.characters.items.${character.id}.temper`)],
  ];

  return (
    <main className="min-h-screen bg-background px-4 py-5 text-foreground md:px-6">
      <section className="mx-auto flex w-full max-w-[92rem] flex-col gap-5">
        <header className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <div className="relative min-h-[24rem]">
            <img
              src={character.banner}
              alt={title}
              className="absolute inset-0 size-full object-cover"
              style={{ objectPosition: character.bannerPosition ?? 'center' }}
              draggable="false"
            />
            <div
              className={cn(
                'absolute inset-0 bg-gradient-to-br',
                character.accentClass,
              )}
            />
            <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
            <div className="relative flex min-h-[24rem] flex-col justify-between p-5 text-white md:p-7">
              <Button
                asChild
                variant="outline"
                className="w-fit border-white/25 bg-black/30 text-white hover:bg-white/15 hover:text-white"
              >
                <Link to="/mercenaries">
                  <ArrowLeft className="size-4" />
                  {t('pages.characters.backToMercenaries')}
                </Link>
              </Button>

              <div>
                <h1 className="text-5xl font-black tracking-tight md:text-7xl">
                  {title}
                </h1>
                <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-white/78">
                  {subtitle}
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="grid gap-5 lg:grid-cols-[1fr_24rem]">
          <article className="rounded-lg border border-border bg-card p-4 shadow-sm md:p-5">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              {t('pages.characters.historyEyebrow')}
            </p>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              {history}
            </p>
          </article>
          <aside className="rounded-lg border border-border bg-card p-4 shadow-sm md:p-5">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              {t('pages.characters.statsEyebrow')}
            </p>
            <h2 className="mt-1 text-xl font-black">
              {t('pages.characters.statsTitle')}
            </h2>
            <div className="mt-4 grid gap-3">
              {statRows.map(([label, value]) => (
                <div key={label} className="rounded-lg border border-border bg-background p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-1 font-black">{value}</p>
                </div>
              ))}
            </div>
            {character.passiveScript ? (
              <details className="mt-4 rounded-lg border border-border bg-muted/35 p-3 text-xs">
                <summary className="cursor-pointer font-black">
                  {t('pages.characters.passiveScript')}
                </summary>
                <pre className="mt-2 max-h-44 overflow-auto whitespace-pre-wrap rounded-md bg-background p-2 font-mono text-[0.68rem] leading-5 text-muted-foreground">
                  {character.passiveScript}
                </pre>
              </details>
            ) : null}
          </aside>
        </section>

        <section className="rounded-lg border border-border bg-card p-4 shadow-sm md:p-5">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            {t('pages.characters.cardsEyebrow')}
          </p>
          <h2 className="mt-1 text-2xl font-black">
            {t('pages.characters.cardsTitle')}
          </h2>
          {character.cards.length ? (
            <div className="mt-4 grid justify-items-center gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
              {character.cards.map((card) => (
                <AbilityCard
                  key={card.id}
                  card={card}
                  characterId={character.id}
                  markerClass={character.markerClass}
                  t={t}
                />
              ))}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-border bg-background px-4 py-10 text-center">
              <p className="text-sm font-semibold">
                {t('pages.characters.emptyCardsTitle')}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                {t('pages.characters.emptyCardsDescription')}
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
