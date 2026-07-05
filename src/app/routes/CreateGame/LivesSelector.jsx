import { Minus, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '@/components/kibo-ui/combobox/index.jsx';
import { lifeOptions, MAX_LIVES, MIN_LIVES } from '@/domain/lives.js';

const comboboxOptions = lifeOptions.map((value) => ({ label: value, value }));

export function LivesSelector({ lives, onChange }) {
  const { t } = useTranslation();
  const numericLives = Number(lives);

  return (
    <div className="block min-w-0">
      <span id="lives-label" className="text-sm font-semibold text-foreground">
        {t('pages.createGame.livesNumber')}
      </span>

      <div className="mt-3 flex items-center justify-between rounded-full border border-input bg-background p-1 md:hidden" aria-labelledby="lives-label">
        <button
          type="button"
          className="grid size-11 place-items-center rounded-full transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-40"
          aria-label={t('pages.createGame.decreaseLives')}
          disabled={numericLives <= MIN_LIVES}
          onClick={() => onChange(String(numericLives - 1))}
        >
          <Minus aria-hidden="true" className="size-5" />
        </button>
        <output aria-live="polite" className="min-w-12 text-center text-2xl font-black">
          {lives}
        </output>
        <button
          type="button"
          className="grid size-11 place-items-center rounded-full transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-40"
          aria-label={t('pages.createGame.increaseLives')}
          disabled={numericLives >= MAX_LIVES}
          onClick={() => onChange(String(numericLives + 1))}
        >
          <Plus aria-hidden="true" className="size-5" />
        </button>
      </div>

      <div className="hidden md:block">
        <Combobox data={comboboxOptions} type={t('pages.createGame.lifeType')} value={lives} onValueChange={onChange}>
          <ComboboxTrigger className="mt-3 h-11 w-full min-w-0 rounded-full border-input bg-background px-4 text-sm text-foreground hover:bg-background" />
          <ComboboxContent className="rounded-xl border-border bg-popover">
            <ComboboxList>
              <ComboboxEmpty>{t('pages.createGame.noOptions')}</ComboboxEmpty>
              <ComboboxGroup>
                {comboboxOptions.map((option) => (
                  <ComboboxItem key={option.value} value={option.value} data-checked={lives === option.value}>
                    {option.label}
                  </ComboboxItem>
                ))}
              </ComboboxGroup>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
    </div>
  );
}
