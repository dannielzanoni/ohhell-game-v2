import {
  ChevronLeft,
  ChevronRight,
  Home,
  Lock,
  LockOpen,
  Play,
  Skull,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import hellHandBg from '@/assets/backgrounds/hell-hand-bg.avif';
import lockCharacterSound from '@/assets/sounds/hell-hand/ui/lock_character.mp3';
import selectMenuSound from '@/assets/sounds/hell-hand/ui/select_menu.mp3';
import switchCardSound from '@/assets/sounds/hell-hand/ui/switch_card.mp3';
import { Button } from '@/components/ui/button.jsx';
import TiltedCard from '@/components/ui/TiltedCard.jsx';
import { cn } from '@/lib/utils.js';
import { getPowerDecks } from '@/services/cardDefinitionsService.js';
import { gameTypes } from '@/services/gameTypesService.js';
import { getGamePreferences } from '@/services/gamePreferencesService.js';
import { startHellHandHomeTheme } from '@/services/hellHandAudioService.js';
import { createLobby } from '@/services/lobbyService.js';
import { mercenaries } from '../Characters/characterData.js';

const hellHandDefaultLives = 50;

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

function playSelectSound() {
  const volume = getGamePreferences().volume / 100;

  if (volume <= 0) {
    return;
  }

  const audio = new Audio(selectMenuSound);
  audio.volume = volume;
  audio.play().catch(() => {});
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

function playLockCharacterSound() {
  const volume = getGamePreferences().volume / 100;

  if (volume <= 0) {
    return;
  }

  const audio = new Audio(lockCharacterSound);
  audio.volume = volume;
  audio.play().catch(() => {});
}

function HellHandCharacterCard({ character, isActive, isLocked, offset, onSelect, t }) {
  const title = t(`pages.characters.items.${character.id}.title`);
  const subtitle = t(`pages.characters.items.${character.id}.subtitle`);
  const xOffset =
    offset === 0
      ? '0rem'
      : offset > 0
        ? 'clamp(7rem, 17vw, 13rem)'
        : 'clamp(-13rem, -17vw, -7rem)';

  return (
    <article
      aria-current={isActive}
      className={cn(
        'absolute left-1/2 top-1/2 h-[18rem] w-[min(86vw,34rem)] rounded-lg opacity-100 outline-none transition duration-300 sm:h-[21rem] sm:w-[36rem] lg:h-[14.5rem] lg:w-[30rem] xl:h-[16.5rem] xl:w-[32rem]',
        isLocked ? 'cursor-default' : 'cursor-pointer',
      )}
      style={{
        transform: `translate(calc(-50% + ${xOffset}), -50%) rotate(0deg) scale(${isActive ? 1 : 0.82})`,
        zIndex: isActive ? 20 : 10 - Math.abs(offset),
      }}
    >
      <button
        type="button"
        className="block size-full cursor-pointer rounded-lg text-left outline-none disabled:cursor-default"
        disabled={isLocked}
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
          rotateAmplitude={isActive && !isLocked ? 11 : 0}
          scaleOnHover={isActive && !isLocked ? 1.04 : 1}
          showMobileWarning={false}
          showTooltip={false}
          displayOverlayContent
          overlayContent={
            <div className="relative flex size-full flex-col justify-between overflow-hidden rounded-lg border border-red-200/15 p-4 text-left text-white shadow-2xl shadow-black/45 sm:p-5">
              <div
                className={cn(
                  'absolute inset-0 bg-gradient-to-br',
                  character.accentClass,
                )}
              />
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
              {isActive && isLocked ? (
                <span className="relative ml-auto grid size-9 place-items-center rounded-md border border-amber-200/20 bg-black/55 text-amber-200">
                  <Lock className="size-4" />
                </span>
              ) : (
                <div />
              )}
              <div className="relative">
                <span
                  className={cn(
                    'mb-2 block h-1.5 w-14 rounded-full sm:mb-3',
                    character.markerClass,
                  )}
                />
                <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
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
    </article>
  );
}

export function HellHandGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeCharacterIndex, setActiveCharacterIndex] = useState(0);
  const [selectedCharacterId, setSelectedCharacterId] = useState('');
  const [powerDeckId, setPowerDeckId] = useState('');
  const [powerDecks, setPowerDecks] = useState([]);
  const [isLoadingPowerDecks, setIsLoadingPowerDecks] = useState(false);
  const [powerDeckError, setPowerDeckError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const isCharacterLocked = Boolean(selectedCharacterId);
  const canCreateGame = Boolean(selectedCharacterId && powerDeckId) && !isLoadingPowerDecks;

  useEffect(() => {
    startHellHandHomeTheme();
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadPowerDecks() {
      setIsLoadingPowerDecks(true);
      setPowerDeckError('');

      try {
        const decks = await getPowerDecks();

        if (isActive) {
          setPowerDecks(Array.isArray(decks) ? decks : []);
          setPowerDeckId('');
        }
      } catch (error) {
        if (isActive) {
          setPowerDecks([]);
          setPowerDeckId('');
          setPowerDeckError(
            error.message || t('pages.createGame.powerDeckLoadError'),
          );
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
  }, [t]);

  const goToPreviousCharacter = () => {
    if (isCharacterLocked) {
      return;
    }

    playSwitchCardSound();
    setActiveCharacterIndex((current) =>
      current === 0 ? mercenaries.length - 1 : current - 1,
    );
  };

  const goToNextCharacter = () => {
    if (isCharacterLocked) {
      return;
    }

    playSwitchCardSound();
    setActiveCharacterIndex((current) => (current + 1) % mercenaries.length);
  };

  const handleCharacterDotSelect = (index) => {
    if (isCharacterLocked || index === activeCharacterIndex) {
      return;
    }

    playSwitchCardSound();
    setActiveCharacterIndex(index);
  };

  const handleCharacterLockToggle = () => {
    if (selectedCharacterId) {
      setSelectedCharacterId('');
      return;
    }

    playLockCharacterSound();
    setSelectedCharacterId(mercenaries[activeCharacterIndex]?.id || '');
  };

  const handlePowerDeckChange = (event) => {
    setPowerDeckId(event.target.value);
  };

  const handleCreateGame = async () => {
    setCreateError('');

    if (!selectedCharacterId) {
      setCreateError(t('pages.hellHandGame.characterRequired'));
      return;
    }

    if (!powerDeckId) {
      setCreateError(t('pages.createGame.powerDeckRequired'));
      return;
    }

    playSelectSound();
    setIsCreating(true);

    try {
      const lobby = await createLobby({
        gameType: gameTypes.FODINHA_POWER,
        lifes: hellHandDefaultLives,
        powerDeckId,
      });
      const lobbyGameType = lobby.game_type || gameTypes.FODINHA_POWER;

      localStorage.setItem(
        `ohhell_lobby_lifes_${lobby.lobby_id}`,
        String(hellHandDefaultLives),
      );
      localStorage.setItem(`ohhell_lobby_game_type_${lobby.lobby_id}`, lobbyGameType);
      localStorage.setItem(`ohhell_lobby_power_deck_${lobby.lobby_id}`, powerDeckId);
      localStorage.setItem(
        `ohhell_lobby_character_${lobby.lobby_id}`,
        selectedCharacterId,
      );

      navigate(`/game/${lobby.lobby_id}`, {
        state: {
          characterId: selectedCharacterId,
          gameType: lobbyGameType,
          lifes: hellHandDefaultLives,
          powerDeckId,
        },
      });
    } catch (error) {
      setCreateError(error.message || t('pages.createGame.createError'));
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-y-auto overflow-x-hidden bg-black text-stone-100 lg:h-screen lg:min-h-0 lg:overflow-hidden">
      <img
        src={hellHandBg}
        alt=""
        className="absolute inset-0 size-full scale-105 object-cover"
        draggable="false"
      />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(245,158,11,0.18),transparent_26%),radial-gradient(circle_at_22%_28%,rgba(185,28,28,0.30),transparent_34%),linear-gradient(115deg,rgba(0,0,0,0.95),rgba(32,8,8,0.82)_48%,rgba(0,0,0,0.96))]" />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/75 to-transparent" />

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center gap-5 px-4 py-8 sm:px-6 lg:h-full lg:min-h-0 lg:gap-3 lg:px-8 lg:py-4">
        <div className="max-w-3xl text-center lg:shrink-0">
          <div className="flex items-center justify-center gap-3 text-amber-300">
            <span className="h-px w-10 bg-amber-300/70" />
            <span className="text-xs font-black uppercase tracking-[0.32em] lg:text-[0.68rem]">
              {t('pages.hellHandGame.eyebrow')}
            </span>
            <span className="h-px w-10 bg-amber-300/70" />
          </div>

          <h1 className="mt-5 text-5xl font-black tracking-tight text-white sm:text-6xl md:text-7xl lg:mt-3 lg:text-5xl xl:text-6xl">
            {t('pages.hellHandGame.title')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-7 text-stone-300 md:text-lg md:leading-8 lg:mt-2 lg:text-sm lg:leading-5">
            {t('pages.createGame.configureBefore')}
          </p>
        </div>

        <section className="w-full max-w-5xl rounded-lg border border-red-200/12 bg-black/70 p-4 shadow-2xl shadow-black/45 backdrop-blur md:p-6 lg:min-h-0 lg:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-md border border-amber-200/15 bg-red-950/50 text-amber-200">
                <Skull className="size-5" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-300/80">
                  {t('pages.createGame.configurations')}
                </p>
                <h2 className="text-2xl font-black text-white lg:text-xl">
                  {t('gameTypes.fodinhaPower')}
                </h2>
              </div>
            </div>

            <div className="flex gap-2 rounded-lg border border-red-200/12 bg-black/50 p-2">
              {mercenaries.map((character, index) => (
                <button
                  key={character.id}
                  type="button"
                  aria-label={t('pages.characters.chooseCharacter', {
                    name: t(`pages.characters.items.${character.id}.title`),
                  })}
                  disabled={isCharacterLocked}
                  className={cn(
                    'size-2.5 rounded-full transition disabled:cursor-not-allowed',
                    activeCharacterIndex === index
                      ? character.markerClass
                      : 'bg-stone-500/45 hover:bg-stone-300/70',
                  )}
                  onClick={() => handleCharacterDotSelect(index)}
                />
              ))}
            </div>
          </div>

          <div className="mt-5 grid gap-5 lg:mt-3 lg:gap-3">
            <section className="min-w-0 rounded-lg border border-red-200/12 bg-red-950/20 p-4 lg:p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.24em] text-amber-300/75">
                    {t('pages.hellHandGame.characterEyebrow')}
                  </p>
                  <h3 className="text-lg font-black text-white lg:text-base">
                    {t('pages.hellHandGame.characterTitle')}
                  </h3>
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-lg"
                    aria-label={t('pages.characters.previous')}
                    className="cursor-pointer border-red-200/15 bg-black/55 text-stone-100 hover:border-amber-300/50 hover:bg-red-950/45 disabled:cursor-not-allowed disabled:opacity-45"
                    disabled={isCharacterLocked}
                    onClick={goToPreviousCharacter}
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-lg"
                    aria-label={t('pages.characters.next')}
                    className="cursor-pointer border-red-200/15 bg-black/55 text-stone-100 hover:border-amber-300/50 hover:bg-red-950/45 disabled:cursor-not-allowed disabled:opacity-45"
                    disabled={isCharacterLocked}
                    onClick={goToNextCharacter}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="relative mt-3 h-[25rem] overflow-hidden rounded-lg border border-red-200/12 bg-black/65 lg:h-[17rem] xl:h-[19rem]">
                {mercenaries.map((character, index) => {
                  const offset = getCarouselOffset(
                    index,
                    activeCharacterIndex,
                    mercenaries.length,
                  );

                  return (
                    <HellHandCharacterCard
                      key={character.id}
                      character={character}
                      isActive={index === activeCharacterIndex}
                      isLocked={isCharacterLocked}
                      offset={offset}
                      t={t}
                      onSelect={() => handleCharacterDotSelect(index)}
                    />
                  );
                })}

                <Button
                  type="button"
                  className="absolute bottom-4 right-4 z-40 h-11 cursor-pointer gap-2 border border-amber-200/40 bg-amber-300 px-5 font-black text-black shadow-xl shadow-black/35 hover:bg-amber-200"
                  onClick={handleCharacterLockToggle}
                >
                  {isCharacterLocked ? (
                    <LockOpen className="size-4" />
                  ) : (
                    <Lock className="size-4" />
                  )}
                  {isCharacterLocked
                    ? t('pages.hellHandGame.unlockCharacter')
                    : t('pages.hellHandGame.selectCharacter')}
                </Button>
              </div>
            </section>

            <label className="block min-w-0 rounded-lg border border-red-200/12 bg-red-950/20 p-4 lg:p-3">
              <span className="text-sm font-semibold text-stone-100">
                {t('pages.createGame.powerDeck')}
              </span>
              <select
                className="mt-3 h-11 w-full cursor-pointer rounded-full border border-red-200/15 bg-black/75 px-4 text-sm text-stone-100 outline-none transition hover:border-amber-300/50 focus-visible:border-amber-300 focus-visible:ring-3 focus-visible:ring-amber-300/30 disabled:cursor-not-allowed disabled:opacity-60 lg:mt-2 lg:h-10"
                disabled={isLoadingPowerDecks || !powerDecks.length}
                value={powerDeckId}
                onChange={handlePowerDeckChange}
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
              <span className="mt-2 block text-sm leading-6 text-stone-400 lg:text-xs lg:leading-5">
                {isLoadingPowerDecks
                  ? t('pages.createGame.loadingPowerDecks')
                  : powerDecks.length
                    ? t('pages.createGame.powerDeckHint')
                    : t('pages.createGame.powerDeckEmpty')}
              </span>
              {powerDeckError ? (
                <span className="mt-2 block text-sm text-red-300">
                  {powerDeckError}
                </span>
              ) : null}
            </label>

            <div className="grid w-full min-w-0 gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={isCreating || !canCreateGame}
                className="inline-flex h-12 w-full min-w-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-amber-300/40 bg-amber-300 px-6 text-base font-black text-black shadow-lg shadow-red-950/30 transition hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={handleCreateGame}
              >
                {isCreating ? (
                  <i className="pi pi-spin pi-spinner text-sm" />
                ) : (
                  <Play className="size-4" />
                )}
                {isCreating ? t('pages.createGame.creating') : t('common.play')}
              </button>

              <Link
                to="/hell-hand"
                className="inline-flex h-12 w-full min-w-0 items-center justify-center gap-2 rounded-full border border-red-200/15 bg-black/65 px-6 text-base font-semibold text-stone-100 transition hover:border-amber-300/50 hover:bg-red-950/45 focus:outline-none focus:ring-2 focus:ring-amber-300"
                onClick={playSelectSound}
              >
                <Home className="size-4" />
                {t('common.home')}
              </Link>
            </div>

            {createError ? (
              <p className="text-sm font-semibold text-red-300">{createError}</p>
            ) : null}
          </div>
        </section>
      </section>
    </main>
  );
}
