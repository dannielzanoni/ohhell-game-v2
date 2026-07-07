import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import TiltedCard from '@/components/ui/TiltedCard.jsx';
import { cn } from '@/lib/utils.js';
import { createMercenary, getMercenaries } from '@/services/mercenariesService.js';
import { isCurrentUserAdmin } from '@/services/authService.js';
import {
  getMercenarySubtitle,
  getMercenaryTitle,
  mercenaries,
  mergeMercenaries,
} from './characterData.js';

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
  const title = getMercenaryTitle(character, t);
  const subtitle = getMercenarySubtitle(character, t);
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

const defaultPassiveScript = `return {
    on_bid_placed = function(game, event, mercenary)
    end,
}`;

function AdminMercenaryForm({ onCreated, t }) {
  const [draft, setDraft] = useState({
    deck: '',
    description: '',
    id: '',
    name: '',
    passiveScript: defaultPassiveScript,
    style: '',
    subtitle: '',
    temper: '',
  });
  const [bannerFile, setBannerFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!draft.id.trim() || !draft.name.trim()) {
      setError(t('pages.characters.admin.idNameRequired'));
      return;
    }

    if (!bannerFile) {
      setError(t('pages.characters.admin.bannerRequired'));
      return;
    }

    if (!draft.passiveScript.trim()) {
      setError(t('pages.characters.admin.passiveRequired'));
      return;
    }

    setIsSaving(true);

    try {
      await createMercenary({ ...draft, bannerFile });
      setDraft({
        deck: '',
        description: '',
        id: '',
        name: '',
        passiveScript: defaultPassiveScript,
        style: '',
        subtitle: '',
        temper: '',
      });
      setBannerFile(null);
      await onCreated();
    } catch (requestError) {
      setError(requestError.message || t('pages.characters.admin.createError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      className="rounded-lg border border-amber-400/40 bg-amber-400/10 p-4 shadow-sm"
      onSubmit={handleSubmit}
    >
      <p className="text-xs font-semibold uppercase text-amber-700 dark:text-amber-300">
        {t('pages.characters.admin.eyebrow')}
      </p>
      <h2 className="mt-1 text-xl font-black">
        {t('pages.characters.admin.title')}
      </h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-semibold">
          {t('pages.characters.admin.id')}
          <Input value={draft.id} onChange={(event) => updateDraft('id', event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          {t('pages.characters.admin.name')}
          <Input value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-semibold md:col-span-2">
          {t('pages.characters.admin.subtitle')}
          <Input
            value={draft.subtitle}
            onChange={(event) => updateDraft('subtitle', event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          {t('pages.characters.stats.deck')}
          <Input value={draft.deck} onChange={(event) => updateDraft('deck', event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          {t('pages.characters.stats.style')}
          <Input value={draft.style} onChange={(event) => updateDraft('style', event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          {t('pages.characters.stats.temper')}
          <Input value={draft.temper} onChange={(event) => updateDraft('temper', event.target.value)} />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          {t('pages.characters.admin.banner')}
          <Input type="file" accept="image/*" onChange={(event) => setBannerFile(event.target.files?.[0] || null)} />
        </label>
        <label className="grid gap-1 text-sm font-semibold md:col-span-2">
          {t('pages.characters.admin.description')}
          <Textarea
            className="min-h-24 resize-none"
            value={draft.description}
            onChange={(event) => updateDraft('description', event.target.value)}
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold md:col-span-2">
          {t('pages.characters.admin.passiveScript')}
          <Textarea
            className="min-h-36 resize-y font-mono text-xs"
            value={draft.passiveScript}
            onChange={(event) => updateDraft('passiveScript', event.target.value)}
          />
        </label>
      </div>
      <Button type="submit" className="mt-4 h-10 cursor-pointer gap-2" disabled={isSaving}>
        {isSaving ? <i className="pi pi-spin pi-spinner text-sm" /> : <Save className="size-4" />}
        {isSaving ? t('pages.characters.admin.saving') : t('pages.characters.admin.save')}
      </Button>
      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}
    </form>
  );
}

export function Mercenaries() {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [characters, setCharacters] = useState(mercenaries);
  const [loadError, setLoadError] = useState('');
  const canCreateMercenary = isCurrentUserAdmin();

  const loadMercenaries = async () => {
    setLoadError('');

    try {
      const response = await getMercenaries();
      setCharacters(mergeMercenaries(Array.isArray(response) ? response : []));
    } catch (requestError) {
      setLoadError(requestError.message || t('pages.characters.loadError'));
      setCharacters(mercenaries);
    }
  };

  useEffect(() => {
    void loadMercenaries();
  }, []);

  const goToPrevious = () => {
    setActiveIndex((current) =>
      current === 0 ? characters.length - 1 : current - 1,
    );
  };

  const goToNext = () => {
    setActiveIndex((current) => (current + 1) % characters.length);
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
              {characters.map((character, index) => (
                <button
                  key={character.id}
                  type="button"
                  aria-label={t('pages.characters.chooseCharacter', {
                    name: getMercenaryTitle(character, t),
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

        {canCreateMercenary ? <AdminMercenaryForm t={t} onCreated={loadMercenaries} /> : null}
        {loadError ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {loadError}
          </p>
        ) : null}

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
              {characters.map((character, index) => {
                const offset = getCarouselOffset(
                  index,
                  activeIndex,
                  characters.length,
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
