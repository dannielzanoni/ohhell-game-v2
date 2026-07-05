import { Check as CheckIcon } from '@untitledui/icons/Check';
import { ChevronDown as ChevronDownIcon } from '@untitledui/icons/ChevronDown';
import { Translate01 as TranslateIcon } from '@untitledui/icons/Translate01';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog.jsx';
import { getResolvedLanguage, languageOptions, setAppLanguage } from '@/i18n/index.js';
import { cn } from '@/lib/utils.js';

export function LanguagePanel({ className }) {
  const { i18n, t } = useTranslation();
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const currentLanguage = getResolvedLanguage(i18n.resolvedLanguage || i18n.language);
  const selectedLanguage =
    languageOptions.find((language) => language.value === currentLanguage) ||
    languageOptions[0];

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className={cn('grid gap-4', className)}>
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-secondary text-secondary-foreground">
          <TranslateIcon className="size-5" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold text-foreground">
            {t('settings.language')}
          </span>
          <span className="block text-xs text-muted-foreground">
            {t('settings.languageDescription')}
          </span>
        </span>
      </div>

      <div ref={dropdownRef} className="relative">
        <label className="text-sm font-semibold text-foreground">
          {t('settings.language')}
        </label>
        <button
          type="button"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className="mt-2 flex h-11 w-full cursor-pointer items-center gap-3 rounded-md border border-input bg-background px-3 text-left text-sm font-semibold text-foreground outline-none transition hover:bg-muted focus:border-ring focus:ring-2 focus:ring-ring/40"
          onClick={() => setIsOpen((current) => !current)}
        >
          <span className={cn('fi', `fi-${selectedLanguage.flagCode}`)} />
          <span className="min-w-0 flex-1 truncate">
            {t(selectedLanguage.labelKey)}
          </span>
          <ChevronDownIcon className="size-4 shrink-0 text-muted-foreground" />
        </button>

        {isOpen ? (
          <div
            role="listbox"
            className="mt-2 overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-xl sm:absolute sm:left-0 sm:right-0 sm:top-full sm:z-[90]"
          >
            {languageOptions.map((language) => (
              <button
                key={language.value}
                type="button"
                role="option"
                aria-selected={language.value === currentLanguage}
                className={cn(
                  'flex w-full cursor-pointer select-none items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-semibold outline-none transition hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
                  language.value === currentLanguage &&
                    'bg-accent text-accent-foreground',
                )}
                onClick={() => {
                  setIsOpen(false);
                  void setAppLanguage(language.value);
                }}
              >
                <span className={cn('fi', `fi-${language.flagCode}`)} />
                <span className="min-w-0 flex-1">{t(language.labelKey)}</span>
                {language.value === currentLanguage ? (
                  <CheckIcon className="size-4 shrink-0" />
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function LanguageNavButton({ isCollapsed = false, onClick }) {
  const { t } = useTranslation();

  return (
    <button
      type="button"
      title={isCollapsed ? t('settings.language') : undefined}
      className={cn(
        'flex h-11 cursor-pointer items-center gap-3 rounded-md px-3 text-sm font-semibold text-muted-foreground transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        isCollapsed && 'justify-center px-0',
      )}
      onClick={onClick}
    >
      <TranslateIcon className="size-4 shrink-0" />
      {!isCollapsed && <span>{t('settings.language')}</span>}
    </button>
  );
}

export function LanguageSettingsModal({ onOpenChange, open, presentation = 'web' }) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        presentation === 'mobile'
          ? 'bottom-0 left-0 top-auto max-w-none translate-x-0 translate-y-0 rounded-b-none pb-[max(1rem,env(safe-area-inset-bottom))]'
          : 'max-w-md',
      )}>
        <DialogHeader>
          <DialogTitle>{t('settings.language')}</DialogTitle>
        </DialogHeader>
        <LanguagePanel />
      </DialogContent>
    </Dialog>
  );
}
