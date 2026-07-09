import { useEffect, useState } from 'react';
import { Check, Crown, Home, Play, Sparkles, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import gameBg from '@/assets/videos/game-bg.mp4';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '@/components/kibo-ui/combobox/index.jsx';
import { InteractiveHoverButton } from '@/components/ui/interactive-hover-button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { cn } from '@/lib/utils.js';
import { getPowerDecks } from '@/services/cardDefinitionsService.js';
import { gameTypeOptions, gameTypes } from '@/services/gameTypesService.js';
import { createLobby } from '@/services/lobbyService.js';

const lifeSettingsByGameType = {
  [gameTypes.FODINHA_CLASSIC]: {
    defaultValue: 5,
    max: 10,
    min: 1,
    roundDamage: 1,
  },
  [gameTypes.FODINHA_POWER]: {
    defaultValue: 50,
    max: 100,
    min: 10,
    roundDamage: 10,
  },
};

const DEFAULT_POWER_BASE_LIFES = 50;
const DEFAULT_POWER_LIFE_MULTIPLIER = '1';

function getLifeSettings(gameType) {
  return lifeSettingsByGameType[gameType] || lifeSettingsByGameType[gameTypes.FODINHA_CLASSIC];
}

function createDefaultLivesByGameType() {
  return Object.fromEntries(
    Object.entries(lifeSettingsByGameType).map(([gameType, settings]) => [
      gameType,
      String(settings.defaultValue),
    ]),
  );
}

function getDefaultLives(gameType) {
  return String(getLifeSettings(gameType).defaultValue);
}

function getInitialGameType(search) {
  const params = new URLSearchParams(search);

  return params.get('mode') === 'hell-hand'
    ? gameTypes.FODINHA_POWER
    : gameTypes.FODINHA_CLASSIC;
}

function getLivesValidationError(value, settings) {
  const selectedLives = Number(value);

  if (
    !Number.isInteger(selectedLives) ||
    selectedLives < settings.min ||
    selectedLives > settings.max
  ) {
    return {
      key: 'pages.createGame.livesRangeError',
      values: { max: settings.max, min: settings.min },
    };
  }

  return null;
}

function getLifeMultiplierValidationError(value) {
  const multiplier = Number(value);

  if (!Number.isFinite(multiplier) || multiplier <= 0) {
    return { key: 'pages.createGame.lifeMultiplierError' };
  }

  return null;
}

function getPowerDeckCreatorName(deck, t) {
  if (deck?.kind === 'official' || deck?.creator_id === 'official') {
    return t('pages.createGame.powerDeckOfficialCreator');
  }

  return deck?.creator_id || '';
}

function PowerDeckGroupSection({
  decks,
  description,
  isOfficial = false,
  selectedDeckId,
  title,
  t,
  onSelect,
}) {
  if (!decks.length) {
    return null;
  }

  const Icon = isOfficial ? Crown : Sparkles;

  return (
    <div
      className={cn(
        'rounded-2xl border p-3',
        isOfficial
          ? 'border-amber-400/35 bg-amber-400/8'
          : 'border-violet-400/25 bg-violet-400/8',
      )}
    >
      <div className="mb-3 flex items-start gap-3">
        <span
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-2xl border',
            isOfficial
              ? 'border-amber-400/45 bg-amber-400/12 text-amber-700'
              : 'border-violet-400/35 bg-violet-400/12 text-violet-700 dark:text-violet-200',
          )}
        >
          <Icon className="size-4" />
        </span>
        <div>
          <p className="text-sm font-black uppercase tracking-[0.16em] text-foreground">
            {title}
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
      </div>

      <div className="grid gap-3">
        {decks.map((deck) => {
          const isSelected = deck.id === selectedDeckId;

          return (
            <button
              key={deck.id}
              type="button"
              className={cn(
                'w-full rounded-2xl border bg-background/95 p-4 text-left shadow-sm transition hover:-translate-y-0.5',
                isSelected
                  ? isOfficial
                    ? 'border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-950/10'
                    : 'border-violet-400 bg-violet-400/10 shadow-lg shadow-violet-950/10'
                  : isOfficial
                    ? 'border-amber-300/25 hover:border-amber-400/45'
                    : 'border-violet-300/20 hover:border-violet-400/40',
              )}
              onClick={() => onSelect(deck.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-foreground">
                    {deck.name}
                  </p>
                  {deck.description ? (
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">
                      {deck.description}
                    </p>
                  ) : null}
                </div>

                {isSelected ? (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[0.68rem] font-black uppercase tracking-[0.14em]',
                      isOfficial
                        ? 'border-amber-400/60 bg-amber-400/15 text-amber-700'
                        : 'border-violet-400/50 bg-violet-400/12 text-violet-700 dark:text-violet-200',
                    )}
                  >
                    <Check className="size-3" />
                    {t('pages.createGame.powerDeckSelected')}
                  </span>
                ) : null}
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded-full border border-border px-2.5 py-1 text-foreground">
                  {t('pages.createGame.powerDeckCardCount', {
                    count: deck.card_count,
                  })}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-muted-foreground">
                  <UserRound className="size-3.5" />
                  {t('pages.createGame.powerDeckCreatedBy', {
                    name: getPowerDeckCreatorName(deck, t),
                  })}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function CreateGame() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [gameType, setGameType] = useState(() => getInitialGameType(location.search));
  const [livesByGameType, setLivesByGameType] = useState(createDefaultLivesByGameType);
  const [powerLifeMultiplier, setPowerLifeMultiplier] = useState(
    DEFAULT_POWER_LIFE_MULTIPLIER,
  );
  const [powerDeckId, setPowerDeckId] = useState('');
  const [powerDecks, setPowerDecks] = useState([]);
  const [acknowledgedCommunityDeckId, setAcknowledgedCommunityDeckId] = useState('');
  const [isLoadingPowerDecks, setIsLoadingPowerDecks] = useState(false);
  const [powerDeckError, setPowerDeckError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const selectedLifeSettings = getLifeSettings(gameType);
  const lives = livesByGameType[gameType] ?? getDefaultLives(gameType);
  const selectedGameTypeOption = gameTypeOptions.find(
    (option) => option.value === gameType,
  );
  const isPowerGame = gameType === gameTypes.FODINHA_POWER;
  const officialPowerDecks = powerDecks.filter((deck) => deck.kind === 'official');
  const communityPowerDecks = powerDecks.filter((deck) => deck.kind !== 'official');
  const selectedPowerDeck = powerDecks.find((deck) => deck.id === powerDeckId) || null;
  const selectedPowerDeckIsCommunity = selectedPowerDeck?.kind === 'community';
  const needsCommunityDeckConsent =
    isPowerGame &&
    selectedPowerDeckIsCommunity &&
    acknowledgedCommunityDeckId !== powerDeckId;
  const isPowerDeckUnavailable =
    isPowerGame &&
    (isLoadingPowerDecks || !powerDeckId || needsCommunityDeckConsent);
  const gameTypeItems = gameTypeOptions.map((option) => ({
    label: t(option.labelKey),
    value: option.value,
  }));

  useEffect(() => {
    if (gameType !== gameTypes.FODINHA_POWER) {
      return undefined;
    }

    let isActive = true;

    async function loadPowerDecks() {
      setIsLoadingPowerDecks(true);
      setPowerDeckError('');

      try {
        const decks = await getPowerDecks();

        if (isActive) {
          const nextDecks = (Array.isArray(decks) ? decks : []).filter(
            (deck) => (deck.status || 'valid') === 'valid',
          );
          setPowerDecks(nextDecks);
          setPowerDeckId((current) => {
            if (nextDecks.some((deck) => deck.id === current)) {
              return current;
            }

            return nextDecks[0]?.id || '';
          });
          if (nextDecks[0]?.kind === 'official') {
            setAcknowledgedCommunityDeckId(nextDecks[0].id);
          }
        }
      } catch (error) {
        if (isActive) {
          setPowerDecks([]);
          setPowerDeckId('');
          setPowerDeckError(error.message || t('pages.createGame.powerDeckLoadError'));
        }
      } finally {
        if (isActive) {
          setIsLoadingPowerDecks(false);
        }
      }
    }

    void loadPowerDecks();

    return () => {
      isActive = false;
    };
  }, [gameType, t]);

  const handleGameTypeChange = (nextGameType) => {
    if (!nextGameType) {
      return;
    }

    setGameType(nextGameType);
  };

  const handleLivesChange = (event) => {
    const { value } = event.target;

    setLivesByGameType((current) => ({
      ...current,
      [gameType]: value,
    }));
  };

  const handlePowerDeckSelect = (deckId) => {
    const nextDeck = powerDecks.find((deck) => deck.id === deckId) || null;

    setPowerDeckId(deckId);
    if (!nextDeck) {
      setAcknowledgedCommunityDeckId('');
      return;
    }

    if (nextDeck.kind === 'official') {
      setAcknowledgedCommunityDeckId(deckId);
      return;
    }

    if (deckId !== powerDeckId) {
      setAcknowledgedCommunityDeckId('');
    }
  };

  const handleCreateGame = async () => {
    setCreateError('');

    const selectedGameType = gameType || gameTypes.FODINHA_CLASSIC;
    const selectedLifeMultiplier =
      selectedGameType === gameTypes.FODINHA_POWER
        ? Number(powerLifeMultiplier)
        : null;
    const estimatedPowerLifes = Math.max(
      1,
      Math.round(DEFAULT_POWER_BASE_LIFES * (selectedLifeMultiplier || 1)),
    );
    const selectedLives =
      selectedGameType === gameTypes.FODINHA_POWER
        ? estimatedPowerLifes
        : Number(lives);

    if (selectedGameType !== gameTypes.FODINHA_POWER) {
      const validationError = getLivesValidationError(
        lives,
        getLifeSettings(selectedGameType),
      );

      if (validationError) {
        setCreateError(t(validationError.key, validationError.values));
        return;
      }
    }

    const selectedPowerDeckId =
      selectedGameType === gameTypes.FODINHA_POWER ? powerDeckId : '';

    if (selectedGameType === gameTypes.FODINHA_POWER && !selectedPowerDeckId) {
      setCreateError(t('pages.createGame.powerDeckRequired'));
      return;
    }

    if (selectedGameType === gameTypes.FODINHA_POWER) {
      const multiplierError = getLifeMultiplierValidationError(powerLifeMultiplier);

      if (multiplierError) {
        setCreateError(t(multiplierError.key));
        return;
      }

      if (needsCommunityDeckConsent) {
        setCreateError(t('pages.createGame.communityDeckConsentRequired'));
        return;
      }
    }

    setIsCreating(true);

    try {
      const lobby = await createLobby({
        gameType: selectedGameType,
        lifes:
          selectedGameType === gameTypes.FODINHA_POWER ? undefined : selectedLives,
        lifeMultiplier: selectedLifeMultiplier,
        powerDeckId: selectedPowerDeckId,
      });
      const lobbyGameType = lobby.game_type || selectedGameType;

      localStorage.setItem(
        `ohhell_lobby_lifes_${lobby.lobby_id}`,
        String(selectedLives),
      );
      localStorage.setItem(`ohhell_lobby_game_type_${lobby.lobby_id}`, lobbyGameType);
      if (selectedPowerDeckId) {
        localStorage.setItem(
          `ohhell_lobby_power_deck_${lobby.lobby_id}`,
          selectedPowerDeckId,
        );
      }
      if (selectedGameType === gameTypes.FODINHA_POWER && selectedLifeMultiplier) {
        localStorage.setItem(
          `ohhell_lobby_power_life_multiplier_${lobby.lobby_id}`,
          String(selectedLifeMultiplier),
        );
      }
      navigate(`/game/${lobby.lobby_id}`, {
        state: {
          gameType: lobbyGameType,
          lifeMultiplier: selectedLifeMultiplier,
          lifes: selectedLives,
          powerDeckId: selectedPowerDeckId,
        },
      });
    } catch (error) {
      setCreateError(error.message || t('pages.createGame.createError'));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-20 overflow-hidden bg-black">
        <video
          className="h-full w-full object-cover opacity-45"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src={gameBg} type="video/mp4" />
        </video>
      </div>
      <div className="absolute inset-0 -z-10 bg-background/80 backdrop-blur-[2px]" />

      <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-6 px-6 py-8">
        <div className="rounded-lg border border-border bg-card/85 p-8 shadow-2xl shadow-black/20 backdrop-blur md:p-10">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">
            {t('pages.createGame.liveTable')}
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
            Oh Hell Game
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            {t('pages.createGame.configureBefore')}
          </p>
        </div>

        <section className="mx-auto w-full max-w-md min-w-0 rounded-lg border border-border bg-card/85 p-5 shadow-lg shadow-black/10 backdrop-blur md:p-6">
          <div>
            <h2 className="text-2xl font-bold">
              {t('pages.createGame.configurations')}
            </h2>
          </div>

          <div className="mt-6 grid gap-5">
            <div className="block min-w-0">
              <span className="text-sm font-semibold text-foreground">
                {t('gameTypes.eyebrow')}
              </span>
              <Combobox
                data={gameTypeItems}
                type={t('gameTypes.eyebrow')}
                value={gameType}
                onValueChange={handleGameTypeChange}
              >
                <ComboboxTrigger className="mt-3 h-11 w-full min-w-0 rounded-full border-input bg-background px-4 text-sm text-foreground hover:bg-background" />
                <ComboboxContent className="rounded-xl border-border bg-popover">
                  <ComboboxList>
                    <ComboboxEmpty>{t('pages.createGame.noOptions')}</ComboboxEmpty>
                    <ComboboxGroup>
                      {gameTypeItems.map((option) => (
                        <ComboboxItem
                          key={option.value}
                          value={option.value}
                          data-checked={gameType === option.value}
                        >
                          {option.label}
                        </ComboboxItem>
                      ))}
                    </ComboboxGroup>
                  </ComboboxList>
                </ComboboxContent>
              </Combobox>
              {selectedGameTypeOption ? (
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t(selectedGameTypeOption.descriptionKey)}
                </p>
              ) : null}
            </div>

            {!isPowerGame ? (
              <div className="block min-w-0">
              <span className="text-sm font-semibold text-foreground">
                {t('pages.createGame.livesNumber')}
              </span>
              <Input
                className="mt-3 h-11 rounded-full border-input bg-background px-4 text-sm text-foreground"
                inputMode="numeric"
                max={selectedLifeSettings.max}
                min={selectedLifeSettings.min}
                step={1}
                type="number"
                value={lives}
                onChange={handleLivesChange}
              />
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {t('pages.createGame.livesRangeHint', {
                  max: selectedLifeSettings.max,
                  min: selectedLifeSettings.min,
                  roundDamage: selectedLifeSettings.roundDamage,
                })}
              </p>
              </div>
            ) : (
              <div className="block min-w-0 rounded-lg border border-border bg-background/55 p-4">
                <p className="text-sm font-semibold text-foreground">
                  {t('pages.createGame.powerLivesDefinedByMercenary')}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t('pages.createGame.powerLivesDefinedByMercenaryHint')}
                </p>
                <label className="mt-4 block">
                  <span className="text-sm font-semibold text-foreground">
                    {t('pages.createGame.lifeMultiplier')}
                  </span>
                  <Input
                    className="mt-3 h-11 rounded-full border-input bg-background px-4 text-sm text-foreground"
                    inputMode="decimal"
                    min="0.1"
                    step="0.1"
                    type="number"
                    value={powerLifeMultiplier}
                    onChange={(event) => setPowerLifeMultiplier(event.target.value)}
                  />
                </label>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t('pages.createGame.lifeMultiplierHint', {
                    baseLives: DEFAULT_POWER_BASE_LIFES,
                    estimatedLives: Math.max(
                      1,
                      Math.round(
                        DEFAULT_POWER_BASE_LIFES * (Number(powerLifeMultiplier) || 1),
                      ),
                    ),
                    multiplier: Number(powerLifeMultiplier) || 1,
                  })}
                </p>
              </div>
            )}

            {isPowerGame ? (
              <div className="block min-w-0 rounded-lg border border-border bg-background/55 p-4">
                <p className="text-sm font-semibold text-foreground">
                  {t('pages.createGame.powerDeck')}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {isLoadingPowerDecks
                    ? t('pages.createGame.loadingPowerDecks')
                    : powerDecks.length
                      ? t('pages.createGame.powerDeckHint')
                      : t('pages.createGame.powerDeckEmpty')}
                </p>
                {powerDecks.length ? (
                  <div className="mt-4 grid gap-4">
                    <PowerDeckGroupSection
                      decks={officialPowerDecks}
                      description={t('pages.createGame.powerDeckGroupOfficialHint')}
                      isOfficial
                      selectedDeckId={powerDeckId}
                      title={t('pages.createGame.powerDeckGroupOfficial')}
                      t={t}
                      onSelect={handlePowerDeckSelect}
                    />
                    <PowerDeckGroupSection
                      decks={communityPowerDecks}
                      description={t('pages.createGame.powerDeckGroupCommunityHint')}
                      selectedDeckId={powerDeckId}
                      title={t('pages.createGame.powerDeckGroupCommunity')}
                      t={t}
                      onSelect={handlePowerDeckSelect}
                    />
                  </div>
                ) : null}
                {selectedPowerDeckIsCommunity ? (
                  <div className="mt-4 rounded-2xl border border-violet-400/35 bg-violet-400/8 p-4">
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-violet-700 dark:text-violet-200">
                      {t('pages.createGame.communityDeckWarningTitle')}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {t('pages.createGame.communityDeckWarningDescription')}
                    </p>
                    <label className="mt-4 flex items-start gap-3 rounded-xl border border-violet-300/30 bg-background/80 p-3 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1 size-4 cursor-pointer accent-violet-500"
                        checked={acknowledgedCommunityDeckId === powerDeckId}
                        onChange={(event) =>
                          setAcknowledgedCommunityDeckId(
                            event.target.checked ? powerDeckId : '',
                          )
                        }
                      />
                      <span>
                        <span className="font-black text-foreground">
                          {t('pages.createGame.communityDeckConsentLabel')}
                        </span>
                        <span className="mt-1 block leading-6 text-muted-foreground">
                          {t('pages.createGame.communityDeckConsentHint')}
                        </span>
                      </span>
                    </label>
                  </div>
                ) : null}
                {powerDeckError ? (
                  <p className="mt-2 text-sm text-destructive">{powerDeckError}</p>
                ) : null}
              </div>
            ) : null}

            <div className="flex w-full min-w-0 flex-col items-start gap-3 rounded-lg border border-border bg-background/55 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {t('pages.createGame.publicRoom')}
                </p>
              </div>
              <button
                type="button"
                disabled
                aria-label={t('pages.createGame.enablePublicRoom')}
                className="relative h-7 w-12 shrink-0 cursor-not-allowed rounded-full bg-muted opacity-60"
              >
                <span className="absolute left-1 top-1 size-5 rounded-full bg-muted-foreground/70" />
              </button>
            </div>

            <div className="grid w-full min-w-0 gap-3 sm:grid-cols-2">
              <InteractiveHoverButton
                type="button"
                disabled={isCreating || isPowerDeckUnavailable}
                className="h-12 w-full min-w-0 border-border text-base disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleCreateGame}
              >
                <span className="inline-flex items-center gap-2">
                  {isCreating ? (
                    <i className="pi pi-spin pi-spinner text-sm" />
                  ) : (
                    <Play className="size-4" />
                  )}
                  {isCreating ? t('pages.createGame.creating') : t('common.play')}
                </span>
              </InteractiveHoverButton>

              <Link
                to="/home"
                className="inline-flex h-12 w-full min-w-0 items-center justify-center gap-2 rounded-full border border-border bg-background px-6 text-base font-semibold text-foreground transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              >
                <Home className="size-4" />
                {t('common.home')}
              </Link>
            </div>

            {createError ? (
              <p className="text-sm text-destructive">{createError}</p>
            ) : null}
          </div>
        </section>
      </section>
    </main>
  );
}
