import { useEffect, useState } from 'react';
import { Check, Layers, Volume2 } from 'lucide-react';
import spanishCard3Paus from '@/assets/cards/spanish/3paus.jpg';
import frenchCard3Paus from '@/assets/cards/french/3paus.png';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.jsx';
import { cn } from '@/lib/utils.js';
import {
  deckTypes,
  getGamePreferences,
  setGamePreferences,
} from '@/services/gamePreferencesService.js';

const tabs = [
  { id: 'sounds', icon: Volume2, label: 'Sounds' },
  { id: 'deck', icon: Layers, label: 'Type of deck' },
];

const deckOptions = [
  {
    description: 'Spanish',
    image: spanishCard3Paus,
    label: 'Spanish',
    value: deckTypes.SPANISH,
  },
  {
    description: 'French',
    image: frenchCard3Paus,
    label: 'French',
    value: deckTypes.FRENCH,
  },
];

export function GameSettingsModal({ onOpenChange, open }) {
  const [activeTab, setActiveTab] = useState('sounds');
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
      <DialogContent className="max-h-[92vh] max-w-[calc(100vw-1rem)] overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border px-4 py-4 sm:px-5">
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="grid max-h-[calc(92vh-4rem)] gap-0 overflow-hidden sm:grid-cols-[12rem_1fr]">
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
                  <span>{tab.label}</span>
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
                    <span className="text-sm font-semibold">Volume geral</span>
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
                  aria-label="Volume geral"
                  className="h-2 w-full cursor-pointer accent-primary"
                  onChange={(event) =>
                    updatePreferences({ volume: event.target.value })
                  }
                />
              </div>
            ) : (
              <div className="grid gap-4" role="tabpanel">
                <div className="grid gap-3 sm:grid-cols-2">
                  {deckOptions.map((deck) => {
                    const isSelected = preferences.deckType === deck.value;

                    return (
                      <button
                        key={deck.value}
                        type="button"
                        aria-pressed={isSelected}
                        className={cn(
                          'relative grid cursor-pointer grid-cols-[5.25rem_1fr] items-center gap-3 rounded-lg border border-border bg-card p-3 text-left shadow-sm transition hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-ring sm:grid-cols-1 sm:p-4',
                          isSelected && 'border-primary ring-2 ring-ring/40',
                        )}
                        onClick={() => updatePreferences({ deckType: deck.value })}
                      >
                        <span className="flex justify-center rounded-md bg-muted/60 py-3 sm:order-2 sm:py-4">
                          <img
                            src={deck.image}
                            alt={`3 de paus ${deck.description}`}
                            className="h-28 w-[4.65rem] rounded-md border border-black object-cover shadow-xl sm:h-36 sm:w-24"
                            draggable="false"
                          />
                        </span>
                        <span className="flex min-w-0 items-center justify-between gap-3 sm:order-1">
                          <span className="text-sm font-bold">{deck.label}</span>
                          <span
                            className={cn(
                              'grid size-6 place-items-center rounded-full border border-border text-transparent',
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
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
