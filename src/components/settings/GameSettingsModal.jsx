import { useEffect, useState } from 'react';
import { Check, Image as ImageIcon, Layers, Volume2 } from 'lucide-react';
import { Translate01 as TranslateIcon } from '@untitledui/icons/Translate01';
import { useTranslation } from 'react-i18next';
import spanishCard3Paus from '@/assets/cards/spanish/3paus.jpg';
import spanish8BitCard3Paus from '@/assets/cards/spanish_8bit/3paus.png';
import frenchCard3Paus from '@/assets/cards/french/3paus.png';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.jsx';
import { LanguagePanel } from '@/components/i18n/LanguageSwitcher.jsx';
import { cn } from '@/lib/utils.js';
import { cardBackOptions } from '@/assets/catalog/cardCatalog.js';
import {
  deckTypes,
  getGamePreferences,
  setGamePreferences,
} from '@/services/gamePreferencesService.js';

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

export function GameSettingsModal({ onOpenChange, open, presentation = 'web' }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('sounds');
  const [activeDeckSettingsTab, setActiveDeckSettingsTab] = useState('deckType');
  const [preferences, setPreferences] = useState(getGamePreferences);

  useEffect(() => {
    if (open) {
      setPreferences(getGamePreferences());
    }
  }, [open]);

  const updatePreferences = (nextPreferences) => {
    setPreferences(setGamePreferences(nextPreferences));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        'flex flex-col overflow-hidden p-0',
        presentation === 'mobile'
          ? 'bottom-0 left-0 top-auto h-[min(88dvh,48rem)] max-w-none translate-x-0 translate-y-0 rounded-b-none px-[env(safe-area-inset-left)] pb-[env(safe-area-inset-bottom)]'
          : 'h-[54dvh] max-w-[calc(100vw-1rem)] sm:h-auto sm:max-h-[46vh] sm:max-w-2xl',
      )}>
        <DialogHeader className="border-b border-border px-4 py-4 sm:px-5">
          <DialogTitle>{t('settings.title')}</DialogTitle>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 grid-rows-[auto_1fr] gap-0 overflow-hidden sm:grid-cols-[12rem_1fr] sm:grid-rows-1">
          <div
            className="flex gap-2 overflow-x-auto border-b border-border bg-muted/40 p-2 sm:flex-col sm:overflow-visible sm:border-b-0 sm:border-r sm:p-3"
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
                  )}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <Icon className="size-4" />
                  <span>{t(tab.labelKey)}</span>
                </button>
              );
            })}
          </div>

          <div className="min-h-0 overflow-y-auto p-4 sm:min-h-[22rem] sm:p-5">
            {activeTab === 'sounds' ? (
              <div className="grid gap-5" role="tabpanel">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-md bg-secondary text-secondary-foreground">
                      <Volume2 className="size-5" />
                    </span>
                    <span className="text-sm font-semibold">
                      {t('settings.generalVolume')}
                    </span>
                  </div>
                  <span className="rounded-md border border-border px-2 py-1 text-sm font-semibold">
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
                  className="h-2 w-full cursor-pointer accent-primary"
                  onChange={(event) =>
                    updatePreferences({ volume: event.target.value })
                  }
                />
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
