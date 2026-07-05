import { useState } from 'react';
import { Check, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AppLayout } from '@/components/layout/AppLayout.jsx';
import { Button } from '@/components/ui/button.jsx';
import {
  gameTypeOptions,
  getSelectedGameType,
  setSelectedGameType,
} from '@/services/gameTypesService.js';

export function GameTypeGate() {
  const { t } = useTranslation();
  const [selectedGameType, setSelectedGameTypeState] = useState(getSelectedGameType);
  const [pendingGameType, setPendingGameType] = useState(
    () => selectedGameType || gameTypeOptions[0]?.value || '',
  );

  if (selectedGameType) {
    return <AppLayout />;
  }

  const confirmSelection = () => {
    const nextGameType = setSelectedGameType(pendingGameType);

    if (nextGameType) {
      setSelectedGameTypeState(nextGameType);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-8 text-foreground">
      <section className="w-full max-w-3xl rounded-2xl border border-border bg-card p-6 shadow-xl md:p-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          {t('gameTypes.eyebrow')}
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
          {t('gameTypes.title')}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
          {t('gameTypes.description')}
        </p>

        <div className="mt-6 grid gap-3">
          {gameTypeOptions.map((option) => {
            const isSelected = pendingGameType === option.value;

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={isSelected}
                className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 text-left transition hover:border-primary/60 ${
                  isSelected ? 'border-primary bg-primary/10' : 'border-border bg-background'
                }`}
                onClick={() => setPendingGameType(option.value)}
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-secondary text-secondary-foreground">
                  <Layers className="size-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-lg font-black">
                    {t(option.labelKey)}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-muted-foreground">
                    {t(option.descriptionKey)}
                  </span>
                </span>
                {isSelected ? <Check className="size-5 shrink-0 text-primary" /> : null}
              </button>
            );
          })}
        </div>

        <Button
          type="button"
          className="mt-6 h-11 w-full cursor-pointer rounded-full font-bold md:w-auto md:px-8"
          disabled={!pendingGameType}
          onClick={confirmSelection}
        >
          {t('gameTypes.continue')}
        </Button>
      </section>
    </main>
  );
}
