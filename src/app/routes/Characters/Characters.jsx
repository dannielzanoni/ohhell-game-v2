import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  House,
  LayoutGrid,
  Images,
  Pencil,
  Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import {
  fetchLuaStudioSnippetSource,
  LuaStudioFrame,
} from '@/components/lua/LuaStudioFrame.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { environment } from '@/config/environment.js';
import TiltedCard from '@/components/ui/TiltedCard.jsx';
import hellHandBg from '@/assets/backgrounds/hell-hand-bg.avif';
import switchCardSound from '@/assets/sounds/hell-hand/ui/switch_card.mp3';
import { cn } from '@/lib/utils.js';
import { getGamePreferences } from '@/services/gamePreferencesService.js';
import { startHellHandHomeTheme } from '@/services/hellHandAudioService.js';
import {
  createMercenary,
  getMercenaries,
  updateMercenary,
} from '@/services/mercenariesService.js';
import { isCurrentUserAdmin, isMissingAuthTokenError } from '@/services/authService.js';
import {
  getMercenarySubtitle,
  getMercenaryTitle,
  normalizeRemoteMercenaries,
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

function playSwitchCardSound() {
  const volume = getGamePreferences().volume / 100;

  if (volume <= 0) {
    return;
  }

  const audio = new Audio(switchCardSound);
  audio.volume = volume;
  audio.play().catch(() => {});
}

function CharacterCard({
  canEdit,
  character,
  isActive,
  onEdit,
  onSelect,
  offset,
  t,
}) {
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
        'absolute left-1/2 top-1/2 h-[20.5rem] w-[min(92vw,41rem)] cursor-pointer rounded-lg opacity-100 outline-none transition duration-300 focus-visible:ring-3 focus-visible:ring-amber-300/50 sm:h-[24rem] sm:w-[43rem] lg:h-[calc(100%-1rem)] lg:max-h-[20.5rem] lg:w-[min(62vw,40rem)] xl:max-h-[22rem]',
        isActive ? 'brightness-100' : 'brightness-75 hover:brightness-90',
      )}
      style={{
        transform: `translate(calc(-50% + ${xOffset}), -50%) rotate(0deg) scale(${isActive ? 1 : 0.82})`,
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
          rotateAmplitude={isActive ? 11 : 0}
          scaleOnHover={isActive ? 1.04 : 1}
          showMobileWarning={false}
          showTooltip={false}
          displayOverlayContent
          overlayContent={
            <div className="relative flex size-full flex-col justify-between overflow-hidden rounded-lg border border-red-200/15 p-4 text-left text-white shadow-2xl shadow-black/45 sm:p-5 lg:p-4">
              <div
                className={cn(
                  'absolute inset-0 bg-gradient-to-br',
                  character.accentClass,
                )}
              />
              <div className={cn('absolute inset-0', character.styleGlowClass)} />
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/88 via-black/42 to-transparent" />
              <div />
              <div className="relative">
                <span
                  className={cn(
                    'mb-2 block h-1.5 w-14 rounded-full sm:mb-3',
                    character.markerClass,
                  )}
                />
                <h2 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-4xl">
                  {title}
                </h2>
                <p className="mt-2 max-w-[24rem] text-sm font-semibold leading-5 text-stone-200/85 sm:leading-6 lg:max-w-[22rem] lg:leading-5">
                  {subtitle}
                </p>
              </div>
            </div>
          }
        />
      </button>
      {isActive ? (
        <div className="absolute bottom-4 right-4 z-30 flex flex-wrap justify-end gap-2">
          {canEdit ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 cursor-pointer gap-2 border-red-200/20 bg-black/70 text-stone-100 shadow-lg shadow-black/30 hover:border-amber-300/45 hover:bg-red-950/65 hover:text-amber-100 lg:h-9"
              onClick={onEdit}
            >
              <Pencil className="size-4" />
              {t('pages.characters.edit')}
            </Button>
          ) : null}
          <Button
            asChild
            className="h-10 cursor-pointer gap-2 border border-amber-200/40 bg-amber-300 text-black shadow-lg shadow-black/30 hover:bg-amber-200 lg:h-9"
          >
            <Link
              to={`/hell-hand/mercenaries/${encodeURIComponent(character.name || character.id)}`}
            >
              <Eye className="size-4" />
              {t('pages.characters.inspect')}
            </Link>
          </Button>
        </div>
      ) : null}
    </article>
  );
}

function CharacterPreviewCard({ canEdit, character, onEdit, t }) {
  const title = getMercenaryTitle(character, t);
  const subtitle = getMercenarySubtitle(character, t);

  return (
    <article className="relative h-full min-h-0 overflow-hidden rounded-lg border border-red-200/15 bg-black/70 text-white shadow-2xl shadow-black/45">
      <img
        src={character.banner}
        alt={title}
        className="absolute inset-0 size-full object-cover"
        draggable="false"
      />
      <div
        className={cn(
          'absolute inset-0 bg-gradient-to-br',
          character.accentClass,
        )}
      />
      <div className={cn('absolute inset-0', character.styleGlowClass)} />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/92 via-black/54 to-transparent" />
      <div className="relative flex size-full flex-col justify-end p-4 sm:p-5 lg:p-4">
        <span
          className={cn(
            'mb-2 block h-1.5 w-14 rounded-full sm:mb-3',
            character.markerClass,
          )}
        />
        <h2 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-4xl">
          {title}
        </h2>
        <p className="mt-2 max-w-[24rem] text-sm font-semibold leading-5 text-stone-200/85 sm:leading-6 lg:max-w-[22rem] lg:leading-5">
          {subtitle}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {canEdit ? (
            <Button
              type="button"
              variant="outline"
              className="h-10 w-fit cursor-pointer gap-2 border-red-200/20 bg-black/70 text-stone-100 shadow-lg shadow-black/30 hover:border-amber-300/45 hover:bg-red-950/65 hover:text-amber-100 lg:h-9"
              onClick={onEdit}
            >
              <Pencil className="size-4" />
              {t('pages.characters.edit')}
            </Button>
          ) : null}
          <Button
            asChild
            className="h-10 w-fit cursor-pointer gap-2 border border-amber-200/40 bg-amber-300 text-black shadow-lg shadow-black/30 hover:bg-amber-200 lg:h-9"
          >
            <Link
              to={`/hell-hand/mercenaries/${encodeURIComponent(character.name || character.id)}`}
            >
              <Eye className="size-4" />
              {t('pages.characters.inspect')}
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}

function CharacterIconSelect({
  activeIndex,
  canEdit,
  characters,
  hoveredIndex,
  onEdit,
  onHover,
  onSelect,
  t,
}) {
  const previewCharacter = characters[hoveredIndex ?? activeIndex] || characters[0];

  return (
    <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[minmax(13rem,17rem)_1fr]">
      <div className="min-h-0 overflow-y-auto rounded-lg border border-red-200/12 bg-black/55 p-3 shadow-inner">
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4">
          {characters.map((character, index) => {
            const title = getMercenaryTitle(character, t);
            const isActive = index === activeIndex;

            return (
              <button
                key={character.id}
                type="button"
                aria-label={t('pages.characters.chooseCharacter', {
                  name: title,
                })}
                className={cn(
                  'group relative aspect-square overflow-hidden rounded-md border bg-black shadow-lg shadow-black/25 outline-none transition focus-visible:ring-2 focus-visible:ring-amber-300',
                  isActive
                    ? 'border-amber-300 ring-2 ring-amber-300/35'
                    : 'border-red-200/15 hover:border-amber-300/55',
                )}
                onClick={() => onSelect(index)}
                onMouseEnter={() => onHover(index)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(index)}
                onBlur={() => onHover(null)}
              >
                <img
                  src={character.icon || character.banner}
                  alt=""
                  className="size-full object-cover transition duration-200 group-hover:scale-105"
                  draggable="false"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <span
                  className={cn(
                    'absolute inset-x-1 bottom-1 h-1 rounded-full',
                    character.markerClass,
                  )}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-[18rem] lg:min-h-0">
        {previewCharacter ? (
          <CharacterPreviewCard
            canEdit={canEdit}
            character={previewCharacter}
            t={t}
            onEdit={() => onEdit(previewCharacter.id)}
          />
        ) : null}
      </div>
    </div>
  );
}

const defaultPassiveScript = `---@type MercenaryPassiveScript
return {
    base_life = 50,
    initial_mana = 2,
    on_match_started = function(game, event, mercenary)
    end,
    on_round_start = function(game, event, mercenary)
    end,
}`;

function emptyDraft() {
  return {
    description: '',
    name: '',
    passiveScript: defaultPassiveScript,
    style: '',
    subtitle: '',
    temper: '',
  };
}

function AdminMercenaryForm({
  characters,
  editRequest,
  onCreated,
  onOpenChange,
  t,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState('');
  const [bannerFile, setBannerFile] = useState(null);
  const [iconFile, setIconFile] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [luaEditorKey, setLuaEditorKey] = useState(0);
  const [luaSnippetId, setLuaSnippetId] = useState('');
  const [luaValidation, setLuaValidation] = useState({ state: 'pending', source: '', diagnostics: [] });
  const [validationRequest, setValidationRequest] = useState(0);
  const [error, setError] = useState('');

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleToggleOpen = () => {
    setIsOpen((current) => {
      const nextIsOpen = !current;
      onOpenChange?.(nextIsOpen);
      return nextIsOpen;
    });
  };

  const startEditing = useCallback((id) => {
    const mercenary = characters.find((character) => character.id === id);

    setEditingId(id);
    setBannerFile(null);
    setIconFile(null);
    setLuaSnippetId('');
    setLuaValidation({ state: 'pending', source: '', diagnostics: [] });
    setError('');
    setDraft({
      ...emptyDraft(),
      description: mercenary?.description || '',
      name: mercenary?.name || '',
      passiveScript: mercenary?.passiveScript || defaultPassiveScript,
      style: mercenary?.style || '',
      subtitle: mercenary?.subtitle || '',
      temper: mercenary?.temper || '',
    });
    setLuaEditorKey((current) => current + 1);
  }, [characters]);

  const startCreating = () => {
    setEditingId('');
    setDraft(emptyDraft());
    setBannerFile(null);
    setIconFile(null);
    setLuaSnippetId('');
    setLuaValidation({ state: 'pending', source: '', diagnostics: [] });
    setError('');
    setLuaEditorKey((current) => current + 1);
  };

  useEffect(() => {
    if (!editRequest?.id) {
      return;
    }

    startEditing(editRequest.id);
    setIsOpen(true);
    onOpenChange?.(true);
  }, [editRequest, onOpenChange, startEditing]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!draft.name.trim()) {
      setError(t('pages.characters.admin.nameRequired'));
      return;
    }

    if (!editingId && !bannerFile) {
      setError(t('pages.characters.admin.bannerRequired'));
      return;
    }

    if (!editingId && !iconFile) {
      setError(t('pages.characters.admin.iconRequired'));
      return;
    }

    setIsSaving(true);

    try {
      let passiveScript = draft.passiveScript;

      if (luaSnippetId) {
        try {
          passiveScript = await fetchLuaStudioSnippetSource(luaSnippetId);
          updateDraft('passiveScript', passiveScript);
        } catch (requestError) {
          setError(requestError.message || t('pages.characters.admin.luaFetchError'));
          return;
        }
      }

      if (!passiveScript.trim()) {
        setError(t('pages.characters.admin.passiveRequired'));
        return;
      }

      setValidationRequest((current) => current + 1);
      if (luaValidation.source !== passiveScript || luaValidation.state !== 'valid' ||
        luaValidation.diagnostics.some((diagnostic) => diagnostic.severity === 'Error')) {
        setError(t('pages.characters.admin.luaValidationRequired'));
        return;
      }

      const fields = { ...draft, bannerFile, iconFile, passiveScript };

      if (editingId) {
        await updateMercenary(editingId, fields);
      } else {
        await createMercenary(fields);
      }

      startCreating();
      setBannerFile(null);
      setIconFile(null);
      setLuaSnippetId('');
      setLuaEditorKey((current) => current + 1);
      await onCreated();
    } catch (requestError) {
      setError(
        requestError.message ||
          (editingId
            ? t('pages.characters.admin.updateError')
            : t('pages.characters.admin.createError')),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-lg border border-amber-300/30 bg-black/70 shadow-2xl shadow-black/30 backdrop-blur">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-red-950/30 focus:outline-none focus:ring-2 focus:ring-amber-300"
        aria-expanded={isOpen}
        onClick={handleToggleOpen}
      >
        <span>
          <span className="block text-xs font-black uppercase text-amber-300/80">
            {t('pages.characters.admin.eyebrow')}
          </span>
          <span className="mt-1 block text-lg font-black text-white lg:text-base">
            {editingId
              ? t('pages.characters.admin.editTitle')
              : t('pages.characters.admin.title')}
          </span>
        </span>
        <span className="grid size-9 shrink-0 place-items-center rounded-md border border-amber-200/20 bg-amber-950/35 text-amber-200">
          {isOpen ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </span>
      </button>

      {isOpen ? (
        <form className="border-t border-red-200/12 p-4 pt-3" onSubmit={handleSubmit}>
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-stone-300">
              {editingId
                ? t('pages.characters.admin.editing', {
                    name: draft.name || editingId,
                  })
                : t('pages.characters.admin.newMercenary')}
            </p>
            {editingId ? (
              <Button
                type="button"
                variant="outline"
                className="h-10 cursor-pointer border-red-200/20 bg-black/55 text-stone-100 hover:border-amber-300/45 hover:bg-red-950/55 hover:text-amber-100"
                onClick={startCreating}
              >
                {t('pages.characters.admin.createNew')}
              </Button>
            ) : null}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-semibold text-stone-100 md:col-span-2">
              {t('pages.characters.admin.name')}
              <Input value={draft.name} onChange={(event) => updateDraft('name', event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-stone-100 md:col-span-2">
              {t('pages.characters.admin.subtitle')}
              <Input
                value={draft.subtitle}
                onChange={(event) => updateDraft('subtitle', event.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-stone-100">
              {t('pages.characters.stats.style')}
              <Input value={draft.style} onChange={(event) => updateDraft('style', event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-stone-100">
              {t('pages.characters.stats.temper')}
              <Input value={draft.temper} onChange={(event) => updateDraft('temper', event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-stone-100">
              {t('pages.characters.admin.banner')}
              {editingId ? (
                <span className="text-xs font-normal text-stone-400">
                  {t('pages.characters.admin.imageOptional')}
                </span>
              ) : null}
              <Input type="file" accept="image/*" onChange={(event) => setBannerFile(event.target.files?.[0] || null)} />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-stone-100">
              {t('pages.characters.admin.icon')}
              {editingId ? (
                <span className="text-xs font-normal text-stone-400">
                  {t('pages.characters.admin.imageOptional')}
                </span>
              ) : null}
              <Input type="file" accept="image/*" onChange={(event) => setIconFile(event.target.files?.[0] || null)} />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-stone-100 md:col-span-2">
              {t('pages.characters.admin.description')}
              <Textarea
                className="min-h-24 resize-none"
                value={draft.description}
                onChange={(event) => updateDraft('description', event.target.value)}
              />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-stone-100 md:col-span-2">
              {t('pages.characters.admin.passiveScript')}
              <LuaStudioFrame
                key={luaEditorKey}
                onSnippetChange={setLuaSnippetId}
                source={draft.passiveScript}
                templateUrl={environment.luaMercenaryPassiveTemplateUrl}
                title={t('pages.characters.admin.passiveScript')}
                validationRequest={validationRequest}
                onValidationChange={setLuaValidation}
                onSourceChange={(source) => {
                  updateDraft('passiveScript', source);
                  setLuaValidation({ state: 'pending', source, diagnostics: [] });
                }}
              />
            </label>
          </div>
          <Button type="submit" className="mt-4 h-10 cursor-pointer gap-2 border border-amber-200/40 bg-amber-300 text-black hover:bg-amber-200" disabled={isSaving}>
            {isSaving ? <i className="pi pi-spin pi-spinner text-sm" /> : <Save className="size-4" />}
            {isSaving
              ? t('pages.characters.admin.saving')
              : editingId
                ? t('pages.characters.admin.update')
                : t('pages.characters.admin.save')}
          </Button>
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
        </form>
      ) : null}
    </section>
  );
}

export function Mercenaries() {
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [characters, setCharacters] = useState([]);
  const [hoveredCharacterIndex, setHoveredCharacterIndex] = useState(null);
  const [selectionViewMode, setSelectionViewMode] = useState('icons');
  const [loadError, setLoadError] = useState('');
  const [isAdminToolsOpen, setIsAdminToolsOpen] = useState(false);
  const [editRequest, setEditRequest] = useState(null);
  const canCreateMercenary = isCurrentUserAdmin();

  const loadMercenaries = useCallback(async () => {
    setLoadError('');

    try {
      const response = await getMercenaries();
      setCharacters(normalizeRemoteMercenaries(Array.isArray(response) ? response : []));
    } catch (requestError) {
      setCharacters([]);

      if (!isMissingAuthTokenError(requestError)) {
        setLoadError(requestError.message || t('pages.characters.loadError'));
      }
    }
  }, [t]);

  useEffect(() => {
    void loadMercenaries();
    startHellHandHomeTheme();
  }, [loadMercenaries]);

  useEffect(() => {
    const handleAuthCompleted = () => {
      void loadMercenaries();
    };

    window.addEventListener('ohhell:auth-completed', handleAuthCompleted);

    return () => {
      window.removeEventListener('ohhell:auth-completed', handleAuthCompleted);
    };
  }, [loadMercenaries]);

  useEffect(() => {
    if (characters.length && activeIndex >= characters.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, characters.length]);

  const goToPrevious = () => {
    if (!characters.length) {
      return;
    }

    playSwitchCardSound();
    setActiveIndex((current) =>
      current === 0 ? characters.length - 1 : current - 1,
    );
  };

  const goToNext = () => {
    if (!characters.length) {
      return;
    }

    playSwitchCardSound();
    setActiveIndex((current) => (current + 1) % characters.length);
  };

  const handleCharacterSelect = (index) => {
    if (!characters.length || index === activeIndex) {
      return;
    }

    playSwitchCardSound();
    setActiveIndex(index);
  };

  const toggleSelectionViewMode = () => {
    setHoveredCharacterIndex(null);
    setSelectionViewMode((current) => (current === 'cards' ? 'icons' : 'cards'));
  };

  const handleEditCharacter = (characterId) => {
    setEditRequest({
      id: characterId,
      requestedAt: Date.now(),
    });
  };

  return (
    <main
      className={cn(
        'relative min-h-screen overflow-x-hidden bg-black px-4 py-5 text-stone-100 md:px-6 lg:h-dvh lg:min-h-0 lg:py-3',
        isAdminToolsOpen ? 'lg:overflow-y-auto' : 'lg:overflow-hidden',
      )}
    >
      <img
        src={hellHandBg}
        alt=""
        className="absolute inset-0 size-full scale-105 object-cover"
        draggable="false"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_16%,rgba(185,28,28,0.26),transparent_34%),linear-gradient(115deg,rgba(0,0,0,0.94),rgba(36,10,10,0.78)_48%,rgba(0,0,0,0.96))]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/70 to-transparent" />

      <section className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-4 lg:h-full lg:min-h-0 lg:gap-3">
        <header className="rounded-lg border border-red-200/12 bg-black/70 p-4 shadow-2xl shadow-black/35 backdrop-blur lg:shrink-0 lg:p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-black uppercase text-amber-300/80 lg:text-xs">
              {t('pages.characters.eyebrow')}
            </p>
            <Button
              asChild
              variant="outline"
              className="h-9 cursor-pointer gap-2 border-red-200/20 bg-black/55 text-stone-100 hover:border-amber-300/45 hover:bg-red-950/55 hover:text-amber-100"
            >
              <Link to="/hell-hand">
                <House className="size-4" />
                Home
              </Link>
            </Button>
          </div>
          <div className="mt-2 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-2xl">
                {t('pages.characters.title')}
              </h1>
              <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-stone-300 lg:max-w-2xl lg:text-xs lg:leading-4">
                {t('pages.characters.description')}
              </p>
            </div>
            <div className="flex gap-2 rounded-lg border border-red-200/12 bg-black/55 p-2 shadow-inner lg:p-1.5">
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
                      : 'bg-stone-500/45 hover:bg-amber-200/65',
                  )}
                  onClick={() => handleCharacterSelect(index)}
                />
              ))}
            </div>
          </div>
        </header>

        {canCreateMercenary ? (
          <AdminMercenaryForm
            characters={characters}
            editRequest={editRequest}
            t={t}
            onCreated={loadMercenaries}
            onOpenChange={setIsAdminToolsOpen}
          />
        ) : null}
        {loadError ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {loadError}
          </p>
        ) : null}

        <div className="grid gap-4 lg:min-h-0 lg:flex-1">
          <section className="flex flex-col rounded-lg border border-red-200/12 bg-black/68 p-4 shadow-2xl shadow-black/35 backdrop-blur lg:min-h-0 lg:p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-amber-300/70">
                  {t('pages.characters.carouselEyebrow')}
                </p>
                <h2 className="text-xl font-black text-white lg:text-base">
                  {t('pages.characters.carouselTitle')}
                </h2>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-lg"
                  aria-label={t('pages.characters.previous')}
                  className="cursor-pointer border-red-200/15 bg-black/65 text-stone-100 hover:border-amber-300/50 hover:bg-red-950/50 hover:text-amber-100 disabled:cursor-not-allowed disabled:opacity-45 lg:size-9"
                  disabled={!characters.length}
                  onClick={goToPrevious}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-lg"
                  aria-label={
                    selectionViewMode === 'cards'
                      ? 'Show mercenaries as icons'
                      : 'Show mercenaries as cards'
                  }
                  title={
                    selectionViewMode === 'cards'
                      ? 'Show mercenaries as icons'
                      : 'Show mercenaries as cards'
                  }
                  className="cursor-pointer border-red-200/15 bg-black/65 text-stone-100 hover:border-amber-300/50 hover:bg-red-950/50 hover:text-amber-100 lg:size-9"
                  onClick={toggleSelectionViewMode}
                >
                  {selectionViewMode === 'cards' ? (
                    <LayoutGrid className="size-4" />
                  ) : (
                    <Images className="size-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-lg"
                  aria-label={t('pages.characters.next')}
                  className="cursor-pointer border-red-200/15 bg-black/65 text-stone-100 hover:border-amber-300/50 hover:bg-red-950/50 hover:text-amber-100 disabled:cursor-not-allowed disabled:opacity-45 lg:size-9"
                  disabled={!characters.length}
                  onClick={goToNext}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>

            <div className="relative mt-3 h-[34rem] overflow-hidden rounded-lg border border-red-200/12 bg-black/55 shadow-inner sm:h-[38rem] lg:mt-2 lg:min-h-0 lg:flex-1">
              {selectionViewMode === 'icons' ? (
                <div className="size-full p-3">
                  <CharacterIconSelect
                    activeIndex={activeIndex}
                    canEdit={canCreateMercenary}
                    characters={characters}
                    hoveredIndex={hoveredCharacterIndex}
                    t={t}
                    onEdit={handleEditCharacter}
                    onHover={setHoveredCharacterIndex}
                    onSelect={handleCharacterSelect}
                  />
                </div>
              ) : (
                characters.map((character, index) => {
                  const offset = getCarouselOffset(
                    index,
                    activeIndex,
                    characters.length,
                  );

                  return (
                    <CharacterCard
                      key={character.id}
                      canEdit={canCreateMercenary}
                      character={character}
                      isActive={index === activeIndex}
                      offset={offset}
                      t={t}
                      onEdit={() => handleEditCharacter(character.id)}
                      onSelect={() => handleCharacterSelect(index)}
                    />
                  );
                })
              )}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
