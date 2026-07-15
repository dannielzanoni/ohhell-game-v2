import { useEffect, useRef, useState } from 'react';
import { Check, Image as ImageIcon, Layers, Play, Volume2, VolumeX } from 'lucide-react';
import { Translate01 as TranslateIcon } from '@untitledui/icons/Translate01';
import { useTranslation } from 'react-i18next';
import spanishCard3Paus from '@/games/classic/assets/cards/spanish/3paus.jpg';
import spanish8BitCard3Paus from '@/games/classic/assets/cards/spanish-8bit/3paus.png';
import frenchCard3Paus from '@/games/classic/assets/cards/french/3paus.png';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog.jsx';
import { LanguagePanel } from '@/shared/i18n/components/LanguageSwitcher.jsx';
import { cn } from '@/shared/lib/utils.js';
import {
  deckTypes,
  defaultGamePreferences,
  getGamePreferences,
  setGamePreferences,
} from '@/features/settings/model/gamePreferences.js';

const tabs = [
  { id: 'sounds', icon: Volume2, labelKey: 'settings.sounds' },
  { id: 'deck', icon: Layers, labelKey: 'settings.deck' },
  { id: 'language', icon: TranslateIcon, labelKey: 'settings.language' },
];

const deckOptions = [
  {
    image: spanishCard3Paus,
    labelKey: 'settings.spanish',
    value: deckTypes.SPANISH,
  },
  {
    image: spanish8BitCard3Paus,
    labelKey: 'settings.spanish8Bit',
    value: deckTypes.SPANISH_8BIT,
  },
  {
    image: frenchCard3Paus,
    labelKey: 'settings.french',
    value: deckTypes.FRENCH,
  },
];

const deckSettingsTabs = [
  { id: 'deckType', icon: Layers, labelKey: 'settings.deckTypeTab' },
  { id: 'cardBack', icon: ImageIcon, labelKey: 'settings.cardBack' },
];

const cardBackImages = import.meta.glob(
  '/src/games/classic/assets/cards/backs/back_card*.png',
  {
    eager: true,
    import: 'default',
  },
);

const turnSoundFiles = import.meta.glob(
  '/src/games/classic/assets/sounds/turn-sounds/*.mp3',
  {
    eager: true,
    import: 'default',
  },
);

const turnSoundOptions = Object.keys(turnSoundFiles)
  .map((path) => decodeURIComponent(path.split('/').pop().replace(/\.mp3$/i, '')))
  .sort((first, second) => {
    if (first === defaultGamePreferences.turnSound) return -1;
    if (second === defaultGamePreferences.turnSound) return 1;
    return first.localeCompare(second);
  });

function getTurnSoundSrc(soundName) {
  const normalizedName = String(soundName || defaultGamePreferences.turnSound).toLowerCase();
  const match = Object.entries(turnSoundFiles).find(([path]) => {
    const fileName = decodeURIComponent(path.split('/').pop().replace(/\.mp3$/i, ''));
    return fileName.toLowerCase() === normalizedName;
  });

  return match?.[1] || turnSoundFiles['/src/games/classic/assets/sounds/turn-sounds/Default.mp3'];
}

function getCardBackNumber(value) {
  if (value === 'back_card') {
    return 1;
  }

  const [, number] = value.match(/^back_card(\d+)$/) || [];

  return Number(number) || Number.MAX_SAFE_INTEGER;
}

const cardBackOptions = Object.entries(cardBackImages)
  .map(([path, image]) => {
    const value = path.split('/').pop().replace(/\.png$/, '');
    const number = getCardBackNumber(value);

    return {
      image,
      labelValues: { number },
      sort: number,
      value,
    };
  })
  .sort((first, second) => first.sort - second.sort);

export function GameSettingsModal({ onOpenChange, open, variant = 'default' }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('sounds');
  const [activeDeckSettingsTab, setActiveDeckSettingsTab] = useState('deckType');
  const [preferences, setPreferences] = useState(getGamePreferences);
  const previewAudioRef = useRef(null);
  const [previousVolumes, setPreviousVolumes] = useState(() => ({
    hellHandHomeMusicVolume: defaultGamePreferences.hellHandHomeMusicVolume,
    volume: defaultGamePreferences.volume,
  }));
  const isHellHand = variant === 'hellHand';
  const isClassic = variant === 'classic';
  const showHomeMusicVolume = isHellHand;

  useEffect(() => {
    if (open) {
      const nextPreferences = getGamePreferences();

      setPreferences(nextPreferences);
      setPreviousVolumes((currentVolumes) => ({
        hellHandHomeMusicVolume:
          nextPreferences.hellHandHomeMusicVolume > 0
            ? nextPreferences.hellHandHomeMusicVolume
            : currentVolumes.hellHandHomeMusicVolume,
        volume:
          nextPreferences.volume > 0 ? nextPreferences.volume : currentVolumes.volume,
      }));
    }
  }, [open]);

  useEffect(() => () => {
    previewAudioRef.current?.pause();
    previewAudioRef.current = null;
  }, []);

  const updatePreferences = (nextPreferences) => {
    setPreferences(setGamePreferences(nextPreferences));
  };

  const updateVolumePreference = (preferenceKey, value) => {
    const nextVolume = Number(value);

    if (nextVolume > 0) {
      setPreviousVolumes((currentVolumes) => ({
        ...currentVolumes,
        [preferenceKey]: nextVolume,
      }));
    }

    updatePreferences({ [preferenceKey]: nextVolume });
  };

  const toggleVolume = (preferenceKey) => {
    const currentVolume = Number(preferences[preferenceKey]) || 0;

    if (currentVolume > 0) {
      setPreviousVolumes((currentVolumes) => ({
        ...currentVolumes,
        [preferenceKey]: currentVolume,
      }));
      updatePreferences({ [preferenceKey]: 0 });
      return;
    }

    updatePreferences({
      [preferenceKey]:
        previousVolumes[preferenceKey] || defaultGamePreferences[preferenceKey],
    });
  };

  const previewTurnSound = () => {
    previewAudioRef.current?.pause();
    const audio = new Audio(getTurnSoundSrc(preferences.turnSound));
    audio.volume = Math.max(0, Math.min(1, Number(preferences.volume) / 100));
    previewAudioRef.current = audio;
    audio.play().catch(() => {});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'flex h-[54dvh] max-w-[calc(100vw-1rem)] flex-col overflow-hidden p-0 sm:h-auto sm:max-h-[46vh] sm:max-w-2xl',
          isHellHand &&
            'border-red-300/20 bg-black text-stone-100 ring-red-900/70 shadow-2xl shadow-red-950/40',
        )}
      >
        <DialogHeader
          className={cn(
            'border-b border-border px-4 py-4 sm:px-5',
            isHellHand &&
              'border-red-300/15 bg-gradient-to-r from-red-950/80 via-black to-black',
          )}
        >
          <DialogTitle className={cn(isHellHand && 'text-amber-100')}>
            {t('settings.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-rows-[auto_1fr] gap-0 overflow-hidden sm:grid-cols-[12rem_1fr] sm:grid-rows-1">
          <div
            className={cn(
              'flex gap-2 overflow-x-auto border-b border-border bg-muted/40 p-2 sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-r sm:p-3',
              isHellHand &&
                'border-red-300/15 bg-red-950/20 sm:border-red-300/15',
            )}
            role="tablist"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={cn(
                    'flex h-10 min-w-max flex-1 cursor-pointer items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold text-muted-foreground transition sm:flex-none sm:justify-start',
                    isActive && 'bg-background text-foreground shadow-sm',
                    isHellHand &&
                      'text-stone-400 hover:bg-red-950/45 hover:text-amber-100',
                    isHellHand &&
                      isActive &&
                      'border border-red-300/20 bg-red-950/70 text-amber-100 shadow-black/30',
                  )}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon className="size-4" />
                  <span>{t(tab.labelKey)}</span>
                </button>
              );
            })}
          </div>

          <div
            className={cn(
              'min-h-0 overflow-y-auto p-4 sm:min-h-[22rem] sm:p-5',
              isHellHand && 'bg-black/95',
            )}
          >
            {activeTab === 'sounds' ? (
              <div className="grid gap-5" role="tabpanel">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label={t('settings.generalVolume')}
                      title={t('settings.generalVolume')}
                      className={cn(
                        'grid size-10 cursor-pointer place-items-center rounded-md bg-secondary text-secondary-foreground transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring',
                        isHellHand &&
                          'border border-red-300/15 bg-red-950/60 text-amber-200 focus:ring-red-400',
                      )}
                      onClick={() => toggleVolume('volume')}
                    >
                      {preferences.volume > 0 ? (
                        <Volume2 className="size-5" />
                      ) : (
                        <VolumeX className="size-5" />
                      )}
                    </button>
                    <span className="text-sm font-semibold">
                      {t('settings.generalVolume')}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'rounded-md border border-border px-2 py-1 text-sm font-semibold',
                      isHellHand &&
                        'border-red-300/20 bg-red-950/35 text-amber-100',
                    )}
                  >
                    {preferences.volume}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={preferences.volume}
                  aria-label={t('settings.generalVolume')}
                  className={cn(
                    'h-2 w-full cursor-pointer accent-primary',
                    isHellHand && 'accent-red-500',
                  )}
                  onChange={(event) =>
                    updateVolumePreference('volume', event.target.value)
                  }
                />

                <label className="grid gap-2">
                  <span className="text-sm font-semibold">
                    {t('settings.turnSound')}
                  </span>
                  <select
                    value={preferences.turnSound}
                    aria-label={t('settings.turnSound')}
                    className={cn(
                      'h-11 w-full cursor-pointer rounded-md border border-input bg-background px-3 text-sm font-semibold text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/40',
                      isHellHand &&
                        'border-red-300/20 bg-red-950/35 text-stone-100 focus:border-amber-300 focus:ring-amber-300/25',
                    )}
                    onChange={(event) =>
                      updatePreferences({ turnSound: event.target.value })
                    }
                  >
                    {turnSoundOptions.map((soundName) => (
                      <option key={soundName} value={soundName}>
                        {soundName}
                      </option>
                    ))}
                  </select>
                </label>

                {isClassic ? (
                  <button
                    type="button"
                    className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring"
                    onClick={previewTurnSound}
                  >
                    <Play className="size-4" />
                    {t('settings.playTurnActionAudio')}
                  </button>
                ) : null}

                {showHomeMusicVolume ? (
                  <>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label={t('settings.hellHandHomeMusicVolume')}
                      title={t('settings.hellHandHomeMusicVolume')}
                      className={cn(
                        'grid size-10 cursor-pointer place-items-center rounded-md bg-secondary text-secondary-foreground transition hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-ring',
                        isHellHand &&
                          'border border-red-300/15 bg-red-950/60 text-amber-200 focus:ring-red-400',
                      )}
                      onClick={() => toggleVolume('hellHandHomeMusicVolume')}
                    >
                      {preferences.hellHandHomeMusicVolume > 0 ? (
                        <Volume2 className="size-5" />
                      ) : (
                        <VolumeX className="size-5" />
                      )}
                    </button>
                    <span className="text-sm font-semibold">
                      {t('settings.hellHandHomeMusicVolume')}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'rounded-md border border-border px-2 py-1 text-sm font-semibold',
                      isHellHand &&
                        'border-red-300/20 bg-red-950/35 text-amber-100',
                    )}
                  >
                    {preferences.hellHandHomeMusicVolume}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={preferences.hellHandHomeMusicVolume}
                  aria-label={t('settings.hellHandHomeMusicVolume')}
                  className={cn(
                    'h-2 w-full cursor-pointer accent-primary',
                    isHellHand && 'accent-red-500',
                  )}
                  onChange={(event) =>
                    updateVolumePreference(
                      'hellHandHomeMusicVolume',
                      event.target.value,
                    )
                  }
                />
                  </>
                ) : null}
              </div>
            ) : activeTab === 'deck' ? (
              <div className="grid gap-4" role="tabpanel">
                <div
                  className="grid grid-cols-2 gap-1 rounded-lg bg-muted/60 p-1"
                  role="tablist"
                >
                  {deckSettingsTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeDeckSettingsTab === tab.id;

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        className={cn(
                          'flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md px-3 text-xs font-bold text-muted-foreground transition sm:text-sm',
                          isActive && 'bg-background text-foreground shadow-sm',
                        )}
                        onClick={() => setActiveDeckSettingsTab(tab.id)}
                      >
                        <Icon className="size-4 shrink-0" />
                        <span className="truncate">{t(tab.labelKey)}</span>
                      </button>
                    );
                  })}
                </div>

                {activeDeckSettingsTab === 'deckType' ? (
                  <div className="grid gap-3 sm:grid-cols-3">
                    {deckOptions.map((deck) => {
                      const isSelected = preferences.deckType === deck.value;

                      return (
                        <button
                          key={deck.value}
                          type="button"
                          aria-pressed={isSelected}
                          className={cn(
                            'relative grid cursor-pointer grid-cols-[5.25rem_1fr] items-center gap-3 rounded-lg border border-border bg-card p-3 text-left shadow-sm transition hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring sm:grid-cols-1 sm:p-3',
                            isSelected && 'border-primary ring-2 ring-ring/40',
                          )}
                          onClick={() => updatePreferences({ deckType: deck.value })}
                        >
                          <span className="flex justify-center rounded-md bg-muted/60 py-3 sm:order-2 sm:py-3">
                            <img
                              src={deck.image}
                              alt={`3 de paus ${t(deck.labelKey)}`}
                              className="h-28 w-[4.65rem] rounded-md border border-black object-cover shadow-xl sm:h-32 sm:w-[5.35rem]"
                              draggable="false"
                            />
                          </span>
                          <span className="flex min-w-0 items-center justify-between gap-3 sm:order-1">
                            <span className="text-sm font-bold">
                              {t(deck.labelKey)}
                            </span>
                            <span
                              className={cn(
                                'grid size-6 shrink-0 place-items-center rounded-full border border-border text-transparent',
                                isSelected &&
                                  'border-primary bg-primary text-primary-foreground',
                              )}
                            >
                              <Check className="size-4" />
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {cardBackOptions.map((cardBack) => {
                      const isSelected = preferences.cardBack === cardBack.value;

                      return (
                        <button
                          key={cardBack.value}
                          type="button"
                          aria-pressed={isSelected}
                          className={cn(
                            'relative grid cursor-pointer gap-2 rounded-lg border border-border bg-card p-2 text-left shadow-sm transition hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring',
                            isSelected && 'border-primary ring-2 ring-ring/40',
                          )}
                          onClick={() =>
                            updatePreferences({ cardBack: cardBack.value })
                          }
                        >
                          <span className="flex h-28 items-center justify-center rounded-md bg-muted/60 p-2 sm:h-32">
                            <img
                              src={cardBack.image}
                              alt={t('settings.cardBackOption', cardBack.labelValues)}
                              className="h-full w-auto rounded-md border border-black object-cover shadow-xl"
                              draggable="false"
                            />
                          </span>
                          <span className="flex min-w-0 items-center justify-between gap-2">
                            <span className="truncate text-xs font-bold">
                              {t('settings.cardBackOption', cardBack.labelValues)}
                            </span>
                            <span
                              className={cn(
                                'grid size-5 shrink-0 place-items-center rounded-full border border-border text-transparent',
                                isSelected &&
                                  'border-primary bg-primary text-primary-foreground',
                              )}
                            >
                              <Check className="size-3.5" />
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div role="tabpanel">
                <LanguagePanel />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
