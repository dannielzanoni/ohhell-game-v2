import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckSquare,
  Layers3,
  Pencil,
  Plus,
  RefreshCw,
  Sparkles,
  Square,
  Target,
  UserRound,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { getAuthPlayer, isCurrentUserAdmin } from '@/services/authService.js';
import {
  createPowerDeck,
  getCardDefinitions,
  getPowerDecks,
  updatePowerDeck,
} from '@/services/cardDefinitionsService.js';
import { getMercenaries } from '@/services/mercenariesService.js';
import { cn } from '@/lib/utils.js';

function getCreatorName(item, t) {
  if (item?.kind === 'official' || item?.creator_id === 'official') {
    return t('pages.powerDecks.officialCreator');
  }

  return item?.creator_id || '';
}

function getKindLabelKey(kind) {
  return kind === 'official'
    ? 'pages.powerDecks.kind.official'
    : 'pages.powerDecks.kind.community';
}

function getCardTypeLabelKey(cardType) {
  return `pages.powerDecks.cardTypes.${cardType || 'instant'}`;
}

function getKindBadgeClass(kind) {
  return kind === 'official'
    ? 'border-amber-400/60 bg-amber-400/15 text-amber-700 dark:text-amber-300'
    : 'border-primary/40 bg-primary/10 text-primary';
}

function formatDate(value) {
  const timestamp = Number(value);

  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return '';
  }

  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
    new Date(timestamp * 1000),
  );
}

function getAuthPlayerId(player) {
  if (player?.type === 'Anonymous') {
    return player.data?.id || null;
  }

  if (player?.type === 'Google') {
    return player.data?.email || null;
  }

  return player?.id || player?.email || null;
}

function uniqueCardIds(cardIds = []) {
  return Array.from(new Set(cardIds.filter(Boolean)));
}

function normalizeMercenaryCardIds(mercenaryCardIds = {}) {
  return Object.fromEntries(
    Object.entries(mercenaryCardIds)
      .map(([mercenaryId, cardIds]) => [mercenaryId, uniqueCardIds(cardIds)])
      .filter(([, cardIds]) => cardIds.length > 0),
  );
}

function removeCardFromMercenarySelections(mercenaryCardIds, cardId) {
  return normalizeMercenaryCardIds(
    Object.fromEntries(
      Object.entries(mercenaryCardIds || {}).map(([mercenaryId, cardIds]) => [
        mercenaryId,
        cardIds.filter((id) => id !== cardId),
      ]),
    ),
  );
}

function getDeckCardSelections(deck) {
  const sourceGenericCardIds = deck?.generic_card_ids || deck?.genericCardIds || [];
  const sourceMercenaryCardIds =
    deck?.mercenary_card_ids || deck?.mercenaryCardIds || {};
  const hasPartitionedCards =
    sourceGenericCardIds.length ||
    Object.keys(sourceMercenaryCardIds).length;
  const sourceCardIds = uniqueCardIds(
    hasPartitionedCards
      ? sourceGenericCardIds
      : deck?.card_ids || deck?.cardIds || [],
  );
  const selectedCardIds = new Set();
  const genericCardIds = sourceCardIds.filter((cardId) => {
    if (selectedCardIds.has(cardId)) {
      return false;
    }

    selectedCardIds.add(cardId);
    return true;
  });
  const mercenaryCardIds = Object.fromEntries(
    Object.entries(sourceMercenaryCardIds)
      .map(([mercenaryId, cardIds]) => [
        mercenaryId,
        uniqueCardIds(cardIds).filter((cardId) => {
          if (selectedCardIds.has(cardId)) {
            return false;
          }

          selectedCardIds.add(cardId);
          return true;
        }),
      ])
      .filter(([, cardIds]) => cardIds.length > 0),
  );

  return { genericCardIds, mercenaryCardIds };
}

const hellHandEmbeddedThemeClassName =
  '[&_.bg-background]:!bg-black/45 [&_.bg-card]:!bg-black/70 [&_.bg-muted]:!bg-red-950/30 [&_.border-border]:!border-red-200/12 [&_.border-input]:!border-red-200/20 [&_.text-muted-foreground]:!text-stone-400 [&_.text-primary]:!text-amber-300 [&_input]:!bg-black/55 [&_select]:!bg-black/55 [&_textarea]:!bg-black/55 [&_[data-slot=button][data-variant=default]]:!bg-amber-300 [&_[data-slot=button][data-variant=default]]:!text-black [&_[data-slot=button][data-variant=default]:hover]:!bg-amber-200 [&_[data-slot=button][data-variant=outline]]:!border-red-200/20 [&_[data-slot=button][data-variant=outline]]:!bg-black/55 [&_[data-slot=button][data-variant=outline]]:!text-stone-100 [&_[data-slot=button][data-variant=outline]:hover]:!border-amber-300/45 [&_[data-slot=button][data-variant=outline]:hover]:!bg-red-950/55';

export function PowerDecks({ embedded = false, variant = 'default' } = {}) {
  const { t } = useTranslation();
  const isHellHand = variant === 'hellHand';
  const [cards, setCards] = useState([]);
  const [decks, setDecks] = useState([]);
  const [mercenaries, setMercenaries] = useState([]);
  const [activeBucket, setActiveBucket] = useState('generic');
  const [selectedGenericCardIds, setSelectedGenericCardIds] = useState([]);
  const [selectedMercenaryCardIds, setSelectedMercenaryCardIds] = useState({});
  const [deckName, setDeckName] = useState('');
  const [deckDescription, setDeckDescription] = useState('');
  const [deckKind, setDeckKind] = useState('community');
  const [deckStatus, setDeckStatus] = useState('valid');
  const [editingDeckId, setEditingDeckId] = useState('');
  const [error, setError] = useState('');
  const [createError, setCreateError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const canCreateOfficial = isCurrentUserAdmin();
  const currentUserId = getAuthPlayerId(getAuthPlayer());
  const activeSelectedCardIds =
    activeBucket === 'generic'
      ? selectedGenericCardIds
      : selectedMercenaryCardIds[activeBucket] || [];
  const totalSelectedCount = new Set([
    ...selectedGenericCardIds,
    ...Object.values(selectedMercenaryCardIds).flat(),
  ]).size;

  const loadData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const [cardResponse, deckResponse, mercenaryResponse] = await Promise.all([
        getCardDefinitions(),
        getPowerDecks(),
        getMercenaries(),
      ]);

      setCards(Array.isArray(cardResponse) ? cardResponse : []);
      setDecks(Array.isArray(deckResponse) ? deckResponse : []);
      setMercenaries(Array.isArray(mercenaryResponse) ? mercenaryResponse : []);
    } catch (requestError) {
      setError(requestError.message || t('pages.powerDecks.loadError'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const toggleCard = (cardId) => {
    if (activeBucket === 'generic') {
      if (selectedGenericCardIds.includes(cardId)) {
        setSelectedGenericCardIds((current) =>
          current.filter((id) => id !== cardId),
        );
      } else {
        setSelectedMercenaryCardIds((current) =>
          removeCardFromMercenarySelections(current, cardId),
        );
        setSelectedGenericCardIds((current) =>
          uniqueCardIds([...current.filter((id) => id !== cardId), cardId]),
        );
      }
      return;
    }

    const bucketCardIds = selectedMercenaryCardIds[activeBucket] || [];

    if (bucketCardIds.includes(cardId)) {
      setSelectedMercenaryCardIds((current) =>
        normalizeMercenaryCardIds({
          ...current,
          [activeBucket]: (current[activeBucket] || []).filter(
            (id) => id !== cardId,
          ),
        }),
      );
      return;
    }

    setSelectedGenericCardIds((current) => current.filter((id) => id !== cardId));
    setSelectedMercenaryCardIds((current) => {
      const cleaned = removeCardFromMercenarySelections(current, cardId);

      return normalizeMercenaryCardIds({
        ...cleaned,
        [activeBucket]: uniqueCardIds([
          ...(cleaned[activeBucket] || []),
          cardId,
        ]),
      });
    });
  };

  const resetDeckDraft = () => {
    setDeckName('');
    setDeckDescription('');
    setDeckKind('community');
    setDeckStatus('valid');
    setEditingDeckId('');
    setSelectedGenericCardIds([]);
    setSelectedMercenaryCardIds({});
    setActiveBucket('generic');
    setCreateError('');
  };

  const editDeck = (deck) => {
    const { genericCardIds, mercenaryCardIds } = getDeckCardSelections(deck);

    setDeckName(deck.name || '');
    setDeckDescription(deck.description || '');
    setDeckKind(deck.kind || 'community');
    setDeckStatus(deck.status || 'valid');
    setEditingDeckId(deck.id);
    setSelectedGenericCardIds(genericCardIds);
    setSelectedMercenaryCardIds(mercenaryCardIds);
    setActiveBucket('generic');
    setCreateError('');
  };

  const handleCreateDeck = async (event) => {
    event.preventDefault();
    setCreateError('');

    if (!deckName.trim()) {
      setCreateError(t('pages.powerDecks.nameRequired'));
      return;
    }

    setIsCreating(true);

    try {
      const payload = {
        description: deckDescription,
        genericCardIds: uniqueCardIds(selectedGenericCardIds),
        kind: canCreateOfficial ? deckKind : 'community',
        mercenaryCardIds: normalizeMercenaryCardIds(selectedMercenaryCardIds),
        name: deckName,
        status: deckStatus,
      };

      if (editingDeckId) {
        await updatePowerDeck({
          ...payload,
          deckId: editingDeckId,
        });
      } else {
        await createPowerDeck(payload);
      }

      resetDeckDraft();
      await loadData();
    } catch (requestError) {
      setCreateError(
        requestError.message ||
          t(
            editingDeckId
              ? 'pages.powerDecks.updateError'
              : 'pages.powerDecks.createError',
          ),
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main
      className={cn(
        embedded
          ? 'w-full text-foreground'
          : 'min-h-screen bg-background px-4 py-6 text-foreground md:px-6',
        isHellHand && 'text-stone-100',
        isHellHand && hellHandEmbeddedThemeClassName,
      )}
    >
      <section
        className={cn(
          'mx-auto flex w-full max-w-7xl flex-col gap-5',
          embedded && 'max-w-none',
        )}
      >
        <header className="flex flex-col gap-4 rounded-lg border border-border bg-card p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              {t('pages.powerDecks.eyebrow')}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
              {t('pages.powerDecks.title')}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {t('pages.powerDecks.description')}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10 cursor-pointer gap-2"
            disabled={isLoading}
            onClick={() => void loadData()}
          >
            <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
            {t('common.refresh')}
          </Button>
        </header>

        {error ? (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        ) : null}

        <div className="grid gap-5 xl:grid-cols-[minmax(24rem,26rem)_1fr]">
          <aside className="grid gap-5 xl:sticky xl:top-6 xl:self-start">
            <form
              className="rounded-lg border border-border bg-card p-5 shadow-sm"
              onSubmit={handleCreateDeck}
            >
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                {t('pages.powerDecks.createEyebrow')}
              </p>
              <div className="mt-1 flex items-start justify-between gap-3">
                <h2 className="text-xl font-black">
                  {t(
                    editingDeckId
                      ? 'pages.powerDecks.editTitle'
                      : 'pages.powerDecks.createTitle',
                  )}
                </h2>
                {editingDeckId ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 shrink-0 cursor-pointer gap-2"
                    onClick={resetDeckDraft}
                  >
                    <Plus className="size-4" />
                    {t('pages.powerDecks.newDeck')}
                  </Button>
                ) : null}
              </div>

              <div className="mt-5 grid gap-4">
                <label className="grid gap-2 text-sm font-semibold">
                  {t('pages.powerDecks.fields.name')}
                  <Input value={deckName} onChange={(event) => setDeckName(event.target.value)} />
                </label>
                <label className="grid gap-2 text-sm font-semibold">
                  {t('pages.powerDecks.fields.description')}
                  <Textarea
                    className="min-h-24 resize-none"
                    value={deckDescription}
                    onChange={(event) => setDeckDescription(event.target.value)}
                  />
                </label>
                {canCreateOfficial ? (
                  <label className="flex items-start gap-3 rounded-lg border border-amber-400/40 bg-amber-400/10 p-3 text-sm">
                    <input
                      type="checkbox"
                      className="mt-1 size-4 cursor-pointer accent-amber-500"
                      checked={deckKind === 'official'}
                      onChange={(event) =>
                        setDeckKind(event.target.checked ? 'official' : 'community')
                      }
                    />
                    <span>
                      <span className="font-black">
                        {t('pages.powerDecks.officialDeck')}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                        {t('pages.powerDecks.officialDeckHint')}
                      </span>
                    </span>
                  </label>
                ) : null}
                <label className="grid gap-2 text-sm font-semibold">
                  {t('pages.powerDecks.bucket')}
                  <select
                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={activeBucket}
                    onChange={(event) => setActiveBucket(event.target.value)}
                  >
                    <option value="generic">{t('pages.powerDecks.genericBucket')}</option>
                    {mercenaries.map((mercenary) => (
                      <option key={mercenary.id} value={mercenary.id}>
                        {mercenary.name || mercenary.id}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-start gap-3 rounded-lg border border-border bg-background/50 p-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1 size-4 cursor-pointer accent-primary"
                    checked={deckStatus === 'draft'}
                    onChange={(event) => setDeckStatus(event.target.checked ? 'draft' : 'valid')}
                  />
                  <span>
                    <span className="font-black">{t('pages.powerDecks.saveAsDraft')}</span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {t('pages.powerDecks.saveAsDraftHint')}
                    </span>
                  </span>
                </label>
              </div>

                <div className="mt-4 rounded-lg border border-border bg-background/50 p-3 text-sm">
                  <p className="font-semibold">
                    {t('pages.powerDecks.selectedCards', {
                      count: totalSelectedCount,
                    })}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {t('pages.powerDecks.bucketHint', {
                      generic: selectedGenericCardIds.length,
                      mercenary: activeSelectedCardIds.length,
                    })}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {t('pages.powerDecks.selectedHint')}
                  </p>
                </div>

              <Button
                type="submit"
                className="mt-4 h-11 w-full cursor-pointer gap-2"
                disabled={isCreating}
              >
                {isCreating ? (
                  <i className="pi pi-spin pi-spinner text-sm" />
                ) : (
                  <Layers3 className="size-4" />
                )}
                {isCreating
                  ? t(
                      editingDeckId
                        ? 'pages.powerDecks.updating'
                        : 'pages.powerDecks.creating',
                    )
                  : editingDeckId
                    ? t('pages.powerDecks.update')
                    : t('pages.powerDecks.create')}
              </Button>

              {createError ? (
                <p className="mt-3 text-sm text-destructive">{createError}</p>
              ) : null}
            </form>

            <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                {t('pages.powerDecks.savedEyebrow')}
              </p>
              <h2 className="mt-1 text-xl font-black">
                {t('pages.powerDecks.savedTitle', { count: decks.length })}
              </h2>

              <div className="mt-4 grid gap-3">
                {decks.map((deck) => {
                  const canEditDeck =
                    canCreateOfficial ||
                    (currentUserId && deck.creator_id === currentUserId);

                  return (
                  <article
                    key={deck.id}
                    className={cn(
                      'rounded-lg border p-3',
                      deck.kind === 'official'
                        ? 'border-amber-400/60 bg-amber-400/10'
                        : 'border-border',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-black">{deck.name}</p>
                      <span
                        className={cn(
                          'shrink-0 rounded-full border px-2 py-0.5 text-[0.65rem] font-black uppercase tracking-wide',
                          getKindBadgeClass(deck.kind),
                        )}
                      >
                        {t(getKindLabelKey(deck.kind))}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('pages.powerDecks.deckCardCount', {
                        count: deck.card_count,
                      })}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-muted-foreground">
                      {t(`pages.powerDecks.status.${deck.status || 'valid'}`)}
                    </p>
                    {deck.validation_errors?.length ? (
                      <p className="mt-2 text-xs leading-5 text-destructive">
                        {deck.validation_errors.join(' · ')}
                      </p>
                    ) : null}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {t('pages.powerDecks.createdBy', {
                        name: getCreatorName(deck, t),
                      })}
                    </p>
                    {formatDate(deck.created_at) ? (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(deck.created_at)}
                      </p>
                    ) : null}
                    {canEditDeck ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-3 h-9 w-full cursor-pointer gap-2"
                        onClick={() => editDeck(deck)}
                      >
                        <Pencil className="size-4" />
                        {t('pages.powerDecks.editDeck')}
                      </Button>
                    ) : null}
                  </article>
                  );
                })}
                {!decks.length && !isLoading ? (
                  <p className="text-sm text-muted-foreground">
                    {t('pages.powerDecks.noDecks')}
                  </p>
                ) : null}
              </div>
            </section>
          </aside>

          <section className="rounded-lg border border-border bg-card p-5 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase text-muted-foreground">
                {t('pages.powerDecks.cardsEyebrow')}
              </p>
              <h2 className="mt-1 text-xl font-black">
                {t('pages.powerDecks.cardsTitle')}
              </h2>
            </div>

            {isLoading ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-80 animate-pulse rounded-lg bg-muted" />
                ))}
              </div>
            ) : cards.length ? (
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map((card) => {
                  const isSelected = activeSelectedCardIds.includes(card.id);
                  const isOfficial = card.kind === 'official';
                  const SelectIcon = isSelected ? CheckSquare : Square;

                  return (
                    <article
                      key={card.id}
                      className={cn(
                        'overflow-hidden rounded-lg border bg-background shadow-sm transition',
                        isSelected
                          ? isOfficial
                            ? 'border-amber-400 ring-2 ring-amber-400/40'
                            : 'border-primary ring-2 ring-primary/40'
                          : isOfficial
                            ? 'border-amber-400/70 bg-amber-400/5'
                            : 'border-border',
                      )}
                    >
                      <button
                        type="button"
                        className="block w-full cursor-pointer text-left"
                        onClick={() => toggleCard(card.id)}
                      >
                        <div className="aspect-[768/1344] bg-muted">
                          {card.image_url ? (
                            <img
                              src={card.image_url}
                              alt={card.name}
                              className="size-full object-cover"
                            />
                          ) : (
                            <div
                              className={cn(
                                'grid size-full place-items-center p-6 text-center text-white',
                                isOfficial
                                  ? 'bg-gradient-to-br from-amber-900 via-slate-950 to-yellow-600/70'
                                  : 'bg-gradient-to-br from-violet-950 via-slate-950 to-primary/60',
                              )}
                            >
                              <div>
                                <Sparkles className="mx-auto size-10 text-violet-100" />
                                <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-violet-100/80">
                                  {t(getKindLabelKey(card.kind))}
                                </p>
                                <p className="mt-2 line-clamp-3 text-xl font-black leading-tight">
                                  {card.name}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="grid gap-3 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="line-clamp-1 font-black">{card.name}</h3>
                              <p className="mt-1 line-clamp-3 text-sm leading-6 text-muted-foreground">
                                {card.description}
                              </p>
                            </div>
                            <SelectIcon
                              className={cn(
                                'mt-0.5 size-5 shrink-0',
                                isOfficial ? 'text-amber-500' : 'text-primary',
                              )}
                            />
                          </div>

                          <div className="flex flex-wrap gap-2 text-xs font-semibold">
                            <span
                              className={cn(
                                'rounded-full border px-2.5 py-1',
                                getKindBadgeClass(card.kind),
                              )}
                            >
                              {t(getKindLabelKey(card.kind))}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1">
                              <Target className="size-3.5" />
                              {t(getCardTypeLabelKey(card.type))}
                            </span>
                            <span className="rounded-full border border-sky-400/40 bg-sky-400/10 px-2.5 py-1 text-sky-700 dark:text-sky-200">
                              {t('pages.powerDecks.manaCost')}: {card.mana_cost ?? 0}
                            </span>
                            <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2.5 py-1 text-emerald-700 dark:text-emerald-200">
                              {t('pages.powerDecks.quantity')}: {card.quantity ?? 1}
                            </span>
                          </div>

                          {card.script ? (
                            <details className="rounded-lg border border-border bg-muted/35 p-2 text-xs">
                              <summary className="cursor-pointer font-black">
                                {t('pages.powerDecks.luaScript')}
                              </summary>
                              <pre className="mt-2 max-h-36 overflow-auto whitespace-pre-wrap rounded-md bg-background p-2 font-mono text-[0.68rem] leading-5 text-muted-foreground">
                                {card.script}
                              </pre>
                            </details>
                          ) : null}

                          <div className="flex items-center gap-2 border-t border-border pt-3 text-sm text-muted-foreground">
                            <UserRound className="size-4 shrink-0" />
                            <span className="min-w-0 flex-1 truncate">
                              {t('pages.powerDecks.createdBy', {
                                name: getCreatorName(card, t),
                              })}
                            </span>
                          </div>
                        </div>
                      </button>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="mt-5 grid min-h-72 place-items-center rounded-lg border border-dashed border-border bg-background/60 px-4 py-10 text-center">
                <div>
                  <Sparkles className="mx-auto size-10 text-muted-foreground" />
                  <p className="mt-3 text-sm font-semibold">
                    {t('pages.powerDecks.emptyCardsTitle')}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {t('pages.powerDecks.emptyCardsDescription')}
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
