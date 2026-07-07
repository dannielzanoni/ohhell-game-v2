import { useEffect, useState } from 'react';
import { Home, Play } from 'lucide-react';
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

export function CreateGame() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [gameType, setGameType] = useState(() => getInitialGameType(location.search));
  const [livesByGameType, setLivesByGameType] = useState(createDefaultLivesByGameType);
  const [powerDeckId, setPowerDeckId] = useState('');
  const [powerDecks, setPowerDecks] = useState([]);
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
  const isPowerDeckUnavailable = isPowerGame && (isLoadingPowerDecks || !powerDeckId);
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

  const handleCreateGame = async () => {
    setCreateError('');

    const selectedGameType = gameType || gameTypes.FODINHA_CLASSIC;
    const selectedLives = Number(lives);
    const validationError = getLivesValidationError(
      lives,
      getLifeSettings(selectedGameType),
    );

    if (validationError) {
      setCreateError(t(validationError.key, validationError.values));
      return;
    }

    const selectedPowerDeckId =
      selectedGameType === gameTypes.FODINHA_POWER ? powerDeckId : '';

    if (selectedGameType === gameTypes.FODINHA_POWER && !selectedPowerDeckId) {
      setCreateError(t('pages.createGame.powerDeckRequired'));
      return;
    }

    setIsCreating(true);

    try {
      const lobby = await createLobby({
        gameType: selectedGameType,
        lifes: selectedLives,
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
      navigate(`/game/${lobby.lobby_id}`, {
        state: { gameType: lobbyGameType, lifes: selectedLives, powerDeckId: selectedPowerDeckId },
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

            {isPowerGame ? (
              <div className="block min-w-0 rounded-lg border border-border bg-background/55 p-4">
                <label className="text-sm font-semibold text-foreground">
                  {t('pages.createGame.powerDeck')}
                  <select
                    className="mt-3 h-11 w-full rounded-full border border-input bg-background px-4 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    disabled={isLoadingPowerDecks || !powerDecks.length}
                    value={powerDeckId}
                    onChange={(event) => setPowerDeckId(event.target.value)}
                  >
                    <option value="" disabled>
                      {t('pages.createGame.selectPowerDeck')}
                    </option>
                    {powerDecks.map((deck) => (
                      <option key={deck.id} value={deck.id}>
                        {t('pages.createGame.powerDeckOption', {
                          count: deck.card_count,
                          name: deck.name,
                        })}
                      </option>
                    ))}
                  </select>
                </label>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {isLoadingPowerDecks
                    ? t('pages.createGame.loadingPowerDecks')
                    : powerDecks.length
                      ? t('pages.createGame.powerDeckHint')
                      : t('pages.createGame.powerDeckEmpty')}
                </p>
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
