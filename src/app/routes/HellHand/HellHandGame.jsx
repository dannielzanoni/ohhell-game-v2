import {
  ChevronLeft,
  ChevronRight,
  Home,
  Images,
  LayoutGrid,
  Lock,
  LockOpen,
  Play,
  Skull,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import hellHandBg from '@/assets/hell_hand/backgrounds/hell-hand-bg.avif';
import bidIcon from '@/assets/hell_hand/icons/bid.svg';
import heartIcon from '@/assets/hell_hand/icons/heart_1.svg';
import heartTwoIcon from '@/assets/hell_hand/icons/heart_2.svg';
import magicIcon from '@/assets/hell_hand/icons/magic.svg';
import manaIcon from '@/assets/hell_hand/icons/mana.png';
import shieldIcon from '@/assets/hell_hand/icons/shield.svg';
import lockCharacterSound from '@/assets/hell_hand/sounds/ui/lock_character.mp3';
import selectMenuSound from '@/assets/hell_hand/sounds/ui/select_menu.mp3';
import switchCardSound from '@/assets/hell_hand/sounds/ui/switch_card.mp3';
import { Button } from '@/components/ui/button.jsx';
import TiltedCard from '@/components/ui/TiltedCard.jsx';
import { cn } from '@/lib/utils.js';
import { getPowerDecks } from '@/services/cardDefinitionsService.js';
import { isMissingAuthTokenError } from '@/services/authService.js';
import { gameTypes } from '@/services/gameTypesService.js';
import { getGamePreferences } from '@/services/gamePreferencesService.js';
import { startHellHandHomeTheme } from '@/services/hellHandAudioService.js';
import { createLobby } from '@/services/lobbyService.js';
import { getMercenaries } from '@/services/mercenariesService.js';
import {
  getMercenarySubtitle,
  getMercenaryTitle,
  normalizeRemoteMercenaries,
} from '../Characters/characterData.js';

const hellHandDefaultLives = 50;
const gameplayIconSources = {
  bid: bidIcon,
  heart: heartIcon,
  heart_1: heartIcon,
  heart_2: heartTwoIcon,
  life: heartIcon,
  lifes: heartIcon,
  lives: heartIcon,
  magic: magicIcon,
  mana: manaIcon,
  shield: shieldIcon,
};

function normalizeGameplayIconKey(icon) {
  return String(icon || '')
    .trim()
    .toLowerCase()
    .replace(/\.(png|svg|jpg|jpeg|webp)$/i, '');
}

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

function normalizeGameplayStyle(gameplayStyle) {
  if (!gameplayStyle) {
    return { icons: ['mana'], label: 'Mana' };
  }

  if (typeof gameplayStyle === 'string') {
    return { icons: [gameplayStyle.toLowerCase()], label: gameplayStyle };
  }

  return {
    icons: Array.isArray(gameplayStyle.icons)
      ? gameplayStyle.icons
      : [gameplayStyle.icon || gameplayStyle.label || 'mana'],
    label: gameplayStyle.label || gameplayStyle.icon || 'Mana',
  };
}

function StatIcon({ src, alt = '' }) {
  return (
    <img
      src={src}
      alt={alt}
      className="size-4 shrink-0 object-contain drop-shadow sm:size-5 lg:size-4"
      draggable="false"
    />
  );
}

function MercenaryInfoPanel({ character }) {
  const gameplayStyle = normalizeGameplayStyle(character.gameplayStyle);
  const vidaInicial = character.vidaInicial ?? 40;
  const vidaTotal = character.vidaTotal ?? 100;
  const manaInicial = character.manaInicial ?? 1;
  const manaTotal = character.manaTotal ?? 10;
  const temper = character.temper;

  return (
    <div className="absolute right-3 top-3 z-10 grid w-[9.3rem] gap-1.5 rounded-lg border border-red-200/15 bg-black/62 p-2 text-[0.62rem] font-black uppercase leading-tight text-stone-100 shadow-xl shadow-black/35 backdrop-blur sm:right-4 sm:top-4 sm:w-[10.25rem] sm:p-2.5 sm:text-[0.68rem] lg:right-3 lg:top-3 lg:w-[8.9rem] lg:p-2 lg:text-[0.58rem] xl:w-[9.6rem] xl:text-[0.62rem]">
      <span className="flex items-center justify-end gap-1.5 text-right">
        <span>
          {vidaInicial}/{vidaTotal} Life
        </span>
        <StatIcon src={heartIcon} />
      </span>
      <span className="flex items-center justify-end gap-1.5 text-right">
        <span>
          {manaInicial}/{manaTotal} Mana
        </span>
        <StatIcon src={manaIcon} />
      </span>
      <span className="flex flex-wrap items-center justify-end gap-1 text-right text-stone-300">
        <span>Gameplay based on</span>
        <span className="text-amber-200">{gameplayStyle.label}</span>
        {gameplayStyle.icons.map((icon, iconIndex) => {
          const iconKey = normalizeGameplayIconKey(icon);
          const iconSrc = gameplayIconSources[iconKey] || manaIcon;

          return (
            <StatIcon
              key={`${character.id}-${iconKey}-${iconIndex}`}
              src={iconSrc}
            />
          );
        })}
      </span>
      {temper ? (
        <span className="flex flex-wrap items-center justify-end gap-1 text-right text-stone-300">
          <span>Temper</span>
          <span className="text-red-200">{temper}</span>
        </span>
      ) : null}
    </div>
  );
}

function HellHandCharacterCard({ character, isActive, isLocked, offset, onSelect, t }) {
  const title = getMercenaryTitle(character, t);
  const subtitle = getMercenarySubtitle(character, t);
  const xOffset =
    offset === 0
      ? '0rem'
      : offset > 0
        ? 'clamp(8.5rem, 20vw, 16rem)'
        : 'clamp(-16rem, -20vw, -8.5rem)';

  return (
    <article
      aria-current={isActive}
      className={cn(
        'absolute left-1/2 top-1/2 h-[18rem] w-[min(86vw,34rem)] rounded-lg opacity-100 outline-none transition duration-300 sm:h-[21rem] sm:w-[36rem] lg:h-[min(20.9rem,calc(100dvh-28rem))] lg:w-[min(43.2rem,76vw)] xl:h-[min(23.75rem,calc(100dvh-28rem))] xl:w-[min(46.1rem,74vw)]',
        isLocked ? 'cursor-default' : 'cursor-pointer',
      )}
      style={{
        backfaceVisibility: 'hidden',
        transform: `translate3d(calc(-50% + ${xOffset}), -50%, 0) rotate(0deg) scale(${isActive ? 1 : 0.82})`,
        willChange: 'transform',
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
              <MercenaryInfoPanel character={character} />
              {isActive && isLocked ? (
                <span className="relative mr-auto grid size-9 place-items-center rounded-md border border-amber-200/20 bg-black/55 text-amber-200">
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

function HellHandCharacterPreviewCard({ character, isLocked, t }) {
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
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />
      <MercenaryInfoPanel character={character} />
      {isLocked ? (
        <span className="absolute left-4 top-4 z-10 grid size-9 place-items-center rounded-md border border-amber-200/20 bg-black/55 text-amber-200">
          <Lock className="size-4" />
        </span>
      ) : null}
      <div className="relative flex size-full flex-col justify-end p-4 sm:p-5">
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
    </article>
  );
}

function HellHandCharacterIconSelect({
  activeIndex,
  characters,
  hoveredIndex,
  isLocked,
  onHover,
  onSelect,
  t,
}) {
  const previewCharacter = characters[hoveredIndex ?? activeIndex] || characters[0];

  return (
    <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[minmax(12rem,16rem)_1fr]">
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
                aria-disabled={isLocked}
                className={cn(
                  'group relative aspect-square overflow-hidden rounded-md border bg-black shadow-lg shadow-black/25 outline-none transition focus-visible:ring-2 focus-visible:ring-amber-300',
                  isLocked ? 'cursor-not-allowed' : 'cursor-pointer',
                  isActive && isLocked
                    ? 'border-amber-300 ring-2 ring-amber-300/60'
                    : isActive
                      ? 'border-amber-300 ring-2 ring-amber-300/35'
                      : 'border-red-200/15 hover:border-amber-300/55',
                )}
                onClick={() => {
                  if (!isLocked) {
                    onSelect(index);
                  }
                }}
                onMouseEnter={() => onHover(index)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(index)}
                onBlur={() => onHover(null)}
              >
                <img
                  src={character.icon || character.banner}
                  alt=""
                  className={cn(
                    'size-full object-cover transition duration-200',
                    !isLocked && 'group-hover:scale-105',
                  )}
                  draggable="false"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <span
                  className={cn(
                    'absolute inset-x-1 bottom-1 h-1 rounded-full',
                    character.markerClass,
                  )}
                />
                {isActive && isLocked ? (
                  <span className="absolute right-1 top-1 grid size-5 place-items-center rounded-sm border border-amber-200/30 bg-black/70 text-amber-200">
                    <Lock className="size-3" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-[18rem] lg:min-h-0">
        {previewCharacter ? (
          <HellHandCharacterPreviewCard
            character={previewCharacter}
            isLocked={isLocked && previewCharacter.id === characters[activeIndex]?.id}
            t={t}
          />
        ) : null}
      </div>
    </div>
  );
}

export function HellHandGame() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeCharacterIndex, setActiveCharacterIndex] = useState(0);
  const [characters, setCharacters] = useState([]);
  const [hoveredCharacterIndex, setHoveredCharacterIndex] = useState(null);
  const [selectionViewMode, setSelectionViewMode] = useState('icons');
  const [selectedCharacterId, setSelectedCharacterId] = useState('');
  const [powerDeckId, setPowerDeckId] = useState('');
  const [powerDecks, setPowerDecks] = useState([]);
  const [isLoadingPowerDecks, setIsLoadingPowerDecks] = useState(false);
  const [powerDeckError, setPowerDeckError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const isCharacterLocked = Boolean(selectedCharacterId);
  const canCreateGame = Boolean(selectedCharacterId && powerDeckId) && !isLoadingPowerDecks;

  const loadMercenaries = useCallback(async () => {
    try {
      const response = await getMercenaries();
      setCharacters(normalizeRemoteMercenaries(Array.isArray(response) ? response : []));
    } catch (error) {
      setCharacters([]);
    }
  }, []);

  const loadPowerDecks = useCallback(async () => {
    setIsLoadingPowerDecks(true);
    setPowerDeckError('');

    try {
      const decks = await getPowerDecks();

      setPowerDecks(
        (Array.isArray(decks) ? decks : []).filter(
          (deck) => (deck.status || 'valid') === 'valid',
        ),
      );
      setPowerDeckId('');
    } catch (error) {
      setPowerDecks([]);
      setPowerDeckId('');

      if (!isMissingAuthTokenError(error)) {
        setPowerDeckError(
          error.message || t('pages.createGame.powerDeckLoadError'),
        );
      }
    } finally {
      setIsLoadingPowerDecks(false);
    }
  }, [t]);

  useEffect(() => {
    startHellHandHomeTheme();
  }, []);

  useEffect(() => {
    void loadMercenaries();
  }, [loadMercenaries]);

  useEffect(() => {
    void loadPowerDecks();
  }, [loadPowerDecks]);

  useEffect(() => {
    const handleAuthCompleted = () => {
      void loadMercenaries();
      void loadPowerDecks();
    };

    window.addEventListener('ohhell:auth-completed', handleAuthCompleted);

    return () => {
      window.removeEventListener('ohhell:auth-completed', handleAuthCompleted);
    };
  }, [loadMercenaries, loadPowerDecks]);

  useEffect(() => {
    if (characters.length && activeCharacterIndex >= characters.length) {
      setActiveCharacterIndex(0);
    }

    if (
      selectedCharacterId &&
      !characters.some((character) => character.id === selectedCharacterId)
    ) {
      setSelectedCharacterId('');
    }
  }, [activeCharacterIndex, characters, selectedCharacterId]);

  const goToPreviousCharacter = () => {
    if (isCharacterLocked || !characters.length) {
      return;
    }

    playSwitchCardSound();
    setActiveCharacterIndex((current) =>
      current === 0 ? characters.length - 1 : current - 1,
    );
  };

  const goToNextCharacter = () => {
    if (isCharacterLocked || !characters.length) {
      return;
    }

    playSwitchCardSound();
    setActiveCharacterIndex((current) => (current + 1) % characters.length);
  };

  const handleCharacterDotSelect = (index) => {
    if (isCharacterLocked || !characters.length || index === activeCharacterIndex) {
      return;
    }

    playSwitchCardSound();
    setActiveCharacterIndex(index);
  };

  const toggleSelectionViewMode = () => {
    setHoveredCharacterIndex(null);
    setSelectionViewMode((current) => (current === 'cards' ? 'icons' : 'cards'));
  };

  const handleCharacterLockToggle = () => {
    if (selectedCharacterId) {
      setSelectedCharacterId('');
      return;
    }

    if (!characters[activeCharacterIndex]) {
      return;
    }

    playLockCharacterSound();
    setSelectedCharacterId(characters[activeCharacterIndex]?.id || '');
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
      if (!isMissingAuthTokenError(error)) {
        setCreateError(error.message || t('pages.createGame.createError'));
      }
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

      <section className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col items-center justify-center gap-5 px-4 py-8 sm:px-6 lg:h-full lg:min-h-0 lg:gap-1.5 lg:px-5 lg:py-2 xl:gap-2 xl:px-8 xl:py-2">
        <div className="max-w-3xl text-center lg:shrink-0">
          <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl md:text-7xl lg:text-3xl xl:text-4xl">
            {t('pages.hellHandGame.title')}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-7 text-stone-300 md:text-lg md:leading-8 lg:mt-0.5 lg:text-xs lg:leading-4 xl:mt-1 xl:text-sm xl:leading-5">
            {t('pages.createGame.configureBefore')}
          </p>
        </div>

        <section className="w-full max-w-5xl rounded-lg border border-red-200/12 bg-black/70 p-4 shadow-2xl shadow-black/45 backdrop-blur md:p-6 lg:min-h-0 lg:p-2.5 xl:p-3">
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
              {characters.map((character, index) => (
                <button
                  key={character.id}
                  type="button"
                  aria-label={t('pages.characters.chooseCharacter', {
                    name: getMercenaryTitle(character, t),
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

          <div className="mt-5 grid gap-5 lg:mt-1.5 lg:gap-1.5 xl:mt-2 xl:gap-2">
            <section className="min-w-0 rounded-lg border border-red-200/12 bg-red-950/20 p-4 lg:p-2 xl:p-2.5">
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
                    disabled={isCharacterLocked || !characters.length}
                    onClick={goToPreviousCharacter}
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
                    className="cursor-pointer border-red-200/15 bg-black/55 text-stone-100 hover:border-amber-300/50 hover:bg-red-950/45"
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
                    className="cursor-pointer border-red-200/15 bg-black/55 text-stone-100 hover:border-amber-300/50 hover:bg-red-950/45 disabled:cursor-not-allowed disabled:opacity-45"
                    disabled={isCharacterLocked || !characters.length}
                    onClick={goToNextCharacter}
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="relative mt-3 h-[25rem] overflow-hidden rounded-lg border border-red-200/12 bg-black/65 lg:mt-1.5 lg:h-[min(24rem,calc(100dvh-24rem))] xl:mt-2 xl:h-[min(27rem,calc(100dvh-24rem))]">
                {selectionViewMode === 'icons' ? (
                  <div className="size-full p-3">
                    <HellHandCharacterIconSelect
                      activeIndex={activeCharacterIndex}
                      characters={characters}
                      hoveredIndex={hoveredCharacterIndex}
                      isLocked={isCharacterLocked}
                      t={t}
                      onHover={setHoveredCharacterIndex}
                      onSelect={handleCharacterDotSelect}
                    />
                  </div>
                ) : (
                  characters.map((character, index) => {
                    const offset = getCarouselOffset(
                      index,
                      activeCharacterIndex,
                      characters.length,
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
                  })
                )}

                <Button
                  type="button"
                  className="absolute bottom-4 right-4 z-40 h-11 cursor-pointer gap-2 border border-amber-200/40 bg-amber-300 px-5 font-black text-black shadow-xl shadow-black/35 hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-45"
                  disabled={!characters.length && !isCharacterLocked}
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

            <label className="block min-w-0 rounded-lg border border-red-200/12 bg-red-950/20 p-4 lg:p-2 xl:p-2.5">
              <span className="text-sm font-semibold text-stone-100">
                {t('pages.createGame.powerDeck')}
              </span>
              <select
                className="mt-3 h-11 w-full cursor-pointer rounded-full border border-red-200/15 bg-black/75 px-4 text-sm text-stone-100 outline-none transition hover:border-amber-300/50 focus-visible:border-amber-300 focus-visible:ring-3 focus-visible:ring-amber-300/30 disabled:cursor-not-allowed disabled:opacity-60 lg:mt-1 lg:h-9 xl:mt-2 xl:h-10"
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
              <span className="mt-2 block text-sm leading-6 text-stone-400 lg:mt-1 lg:text-xs lg:leading-4 xl:mt-2 xl:leading-5">
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
                className="inline-flex h-12 w-full min-w-0 cursor-pointer items-center justify-center gap-2 rounded-full border border-amber-300/40 bg-amber-300 px-6 text-base font-black text-black shadow-lg shadow-red-950/30 transition hover:bg-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-300 disabled:cursor-not-allowed disabled:opacity-60 lg:h-10 xl:h-12"
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
                className="inline-flex h-12 w-full min-w-0 items-center justify-center gap-2 rounded-full border border-red-200/15 bg-black/65 px-6 text-base font-semibold text-stone-100 transition hover:border-amber-300/50 hover:bg-red-950/45 focus:outline-none focus:ring-2 focus:ring-amber-300 lg:h-10 xl:h-12"
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
