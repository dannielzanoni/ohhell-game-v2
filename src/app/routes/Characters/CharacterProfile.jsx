import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button.jsx';
import hellHandBg from '@/assets/backgrounds/hell-hand-bg.avif';
import manaIcon from '@/assets/icons/hell-hand/mana.png';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog.jsx';
import { cn } from '@/lib/utils.js';
import { startHellHandHomeTheme } from '@/services/hellHandAudioService.js';
import { getMercenaries } from '@/services/mercenariesService.js';
import {
  getCardDefinitions,
  getPowerDecks,
} from '@/services/cardDefinitionsService.js';
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
        'relative overflow-hidden rounded-lg border border-red-200/12 bg-black/70 shadow-inner',
        className,
      )}
    >
      {card.image || card.image_url ? (
        <img
          src={card.image || card.image_url}
          alt={title}
          className="aspect-[768/1344] size-full object-cover"
          draggable="false"
        />
      ) : (
        <div className="relative min-h-52 p-4">
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-red-500/15 to-transparent" />
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
  const title = card.name || card.title || t(`pages.characters.items.${characterId}.cards.${card.id}.title`);
  const description = card.description || card.effect_description || t(
    `pages.characters.items.${characterId}.cards.${card.id}.description`,
  );
  const story = card.story || card.flavor_text || t(
    `pages.characters.items.${characterId}.cards.${card.id}.story`,
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={t('pages.characters.cardInfo', { name: title })}
          className="relative block w-full max-w-[19.8rem] cursor-pointer overflow-hidden rounded-lg border border-red-200/12 bg-black/70 p-2 text-left shadow-xl shadow-black/25 outline-none transition duration-200 hover:border-amber-300/40 hover:shadow-amber-950/25 focus-visible:ring-2 focus-visible:ring-amber-300 lg:max-w-[10.5rem] xl:max-w-[11.4rem] 2xl:max-w-[12.6rem]"
        >
          <CardArtwork card={card} title={title} markerClass={markerClass} />
        </button>
      </DialogTrigger>

      <DialogContent className="border-red-200/15 bg-zinc-950 text-stone-100 sm:max-w-4xl [&_[data-slot=dialog-close]]:size-[2.275rem] [&_[data-slot=dialog-close]_svg]:size-[1.3rem]">
        <div className="grid gap-5 md:grid-cols-[minmax(0,16.5rem)_1fr]">
          <CardArtwork
            card={card}
            title={title}
            markerClass={markerClass}
            className="mx-auto w-full max-w-[16.5rem]"
          />

          <div className="grid content-start gap-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black text-white">
                {title}
              </DialogTitle>
              <DialogDescription className="text-stone-300">
                {description}
              </DialogDescription>
            </DialogHeader>

            <div className="w-fit rounded-lg border border-red-200/12 bg-black/65 px-3 py-2">
              <p className="text-xs font-black uppercase text-amber-300/70">
                {t('pages.characters.manaCost')}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-2xl font-black leading-none text-white">
                  {card.mana_cost ?? card.manaCost ?? 0}
                </span>
                <img
                  src={manaIcon}
                  alt=""
                  className="size-7 object-contain"
                  draggable="false"
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-black uppercase text-amber-300/70">
                {t('pages.characters.cardStory')}
              </p>
              <p className="mt-2 text-sm leading-7 text-stone-300">
                {story}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getOfficialMercenaryCards(characterId, cardDefinitions, decks) {
  const normalizedCharacterId = String(characterId).toLowerCase();
  const cardIds = new Set();
  const cardsById = new Map(
    [...cardDefinitions, ...decks.flatMap((deck) => deck?.cards || [])]
      .filter((card) => card?.id || card?.card_id)
      .map((card) => [String(card.id ?? card.card_id), card]),
  );

  decks
    .filter((deck) => deck?.kind === 'official' || deck?.creator_id === 'official')
    .forEach((deck) => {
      const assignments = deck.mercenary_card_ids || deck.mercenaryCardIds || {};
      Object.entries(assignments).forEach(([mercenaryId, assignedCardIds]) => {
        if (String(mercenaryId).toLowerCase() === normalizedCharacterId) {
          (assignedCardIds || []).forEach((cardId) => cardIds.add(String(cardId)));
        }
      });
    });

  return Array.from(cardIds, (cardId) => cardsById.get(cardId)).filter(Boolean);
}

export function CharacterProfile({ characterId }) {
  const { t } = useTranslation();
  const [characters, setCharacters] = useState(() =>
    mercenaries.map((mercenary) => ({ ...mercenary, cards: [] })),
  );

  useEffect(() => {
    startHellHandHomeTheme();
    let isActive = true;

    async function loadMercenaries() {
      try {
        const [mercenaryResponse, cardResponse, deckResponse] = await Promise.all([
          getMercenaries(),
          getCardDefinitions(),
          getPowerDecks(),
        ]);

        if (isActive) {
          const remoteMercenaries = Array.isArray(mercenaryResponse) ? mercenaryResponse : [];
          const cardDefinitions = Array.isArray(cardResponse) ? cardResponse : [];
          const decks = Array.isArray(deckResponse) ? deckResponse : [];
          setCharacters(
            mergeMercenaries(remoteMercenaries).map((mercenary) => ({
              ...mercenary,
              cards: getOfficialMercenaryCards(
                mercenary.apiId || mercenary.id,
                cardDefinitions,
                decks,
              ),
            })),
          );
        }
      } catch {
        if (isActive) {
          setCharacters(
            mercenaries.map((mercenary) => ({ ...mercenary, cards: [] })),
          );
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
    return <Navigate to="/hell-hand/mercenaries" replace />;
  }

  const title = getMercenaryTitle(character, t);
  const subtitle = getMercenarySubtitle(character, t);
  const history = character.description || t(`pages.characters.items.${character.id}.history`);
  const statRows = [
    [t('pages.characters.stats.style'), character.style || t(`pages.characters.items.${character.id}.style`)],
    [t('pages.characters.stats.temper'), character.temper || t(`pages.characters.items.${character.id}.temper`)],
  ];

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-black px-4 py-5 text-stone-100 md:px-6 lg:h-dvh lg:min-h-0 lg:overflow-hidden lg:py-3">
      <img
        src={hellHandBg}
        alt=""
        className="absolute inset-0 size-full scale-105 object-cover"
        draggable="false"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(185,28,28,0.24),transparent_34%),linear-gradient(115deg,rgba(0,0,0,0.95),rgba(36,10,10,0.78)_48%,rgba(0,0,0,0.97))]" />
      <section className="relative z-10 mx-auto flex w-full max-w-[96rem] flex-col gap-5 lg:grid lg:h-full lg:min-h-0 lg:grid-cols-[minmax(16rem,0.75fr)_minmax(0,1.65fr)] lg:gap-3">
        <header className="overflow-hidden rounded-lg border border-red-200/12 bg-black/70 shadow-2xl shadow-black/35 backdrop-blur lg:min-h-0">
          <div className="relative min-h-[24rem] lg:h-full lg:min-h-0">
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
            <div className={cn('absolute inset-0', character.styleGlowClass)} />
            <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black/90 via-black/45 to-transparent" />
            <div className="relative flex min-h-[24rem] flex-col justify-between p-5 text-white md:p-7 lg:h-full lg:min-h-0 lg:p-5">
              <Button
                asChild
                variant="outline"
                className="w-fit border-red-200/20 bg-black/55 text-white hover:border-amber-300/45 hover:bg-red-950/55 hover:text-amber-100"
              >
                <Link to="/hell-hand/mercenaries">
                  <ArrowLeft className="size-4" />
                  {t('pages.characters.backToMercenaries')}
                </Link>
              </Button>

              <div>
                <h1 className="text-5xl font-black tracking-tight md:text-7xl lg:text-5xl xl:text-6xl">
                  {title}
                </h1>
                <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-white/78 lg:text-sm lg:leading-6">
                  {subtitle}
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="rounded-lg border border-border bg-card p-4 shadow-sm md:p-5">
          <p className="text-xs font-semibold uppercase text-muted-foreground">
            {t('pages.characters.cardsEyebrow')}
          </p>
          <h2 className="mt-1 text-2xl font-black text-white lg:text-xl">
            {t('pages.characters.cardsTitle')}
          </h2>
          {character.cards.length ? (
            <div className="mt-4 grid justify-items-center gap-3 sm:grid-cols-2 lg:mt-3 lg:min-h-0 lg:flex-1 lg:grid-cols-[repeat(auto-fit,minmax(10.5rem,10.5rem))] lg:content-center lg:justify-center lg:gap-2 xl:grid-cols-[repeat(auto-fit,minmax(11.4rem,11.4rem))] 2xl:grid-cols-[repeat(auto-fit,minmax(12.6rem,12.6rem))]">
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
            <div className="mt-4 rounded-lg border border-dashed border-red-200/15 bg-black/55 px-4 py-10 text-center lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:items-center lg:justify-center">
              <p className="text-sm font-semibold text-stone-100">
                {t('pages.characters.emptyCardsTitle')}
              </p>
              <p className="mt-2 text-sm text-stone-400">
                {t('pages.characters.emptyCardsDescription')}
              </p>
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
