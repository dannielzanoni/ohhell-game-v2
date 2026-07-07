// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { useTranslation } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { storage } from '@/infrastructure/storage/storageAdapter.js';
import { storageKeys } from '@/infrastructure/storage/storageKeys.js';
import i18n, {
  getResolvedLanguage,
  LANGUAGE_STORAGE_KEY,
  setAppLanguage,
} from './index.js';

function TranslatedProbe() {
  const { t } = useTranslation();

  return <h1>{t('settings.title')}</h1>;
}

afterEach(async () => {
  cleanup();
  storage.removeItem(storageKeys.language);
  await i18n.changeLanguage('en');
  vi.restoreAllMocks();
});

describe('language switching', () => {
  it('updates mounted views without reloading the page and persists the choice', async () => {
    const reload = vi.fn();
    vi.stubGlobal('location', { ...window.location, reload });
    render(<TranslatedProbe />);

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument();

    await act(async () => {
      await setAppLanguage('pt');
    });

    expect(screen.getByRole('heading', { name: 'Configurações' })).toBeInTheDocument();
    expect(storage.getItem(LANGUAGE_STORAGE_KEY)).toBe('pt');
    expect(reload).not.toHaveBeenCalled();
  });

  it('uses the defined fallback for invalid languages', async () => {
    expect(getResolvedLanguage('pt-BR')).toBe('pt');
    expect(getResolvedLanguage('fr-FR')).toBe('en');

    await act(async () => {
      await setAppLanguage('klingon');
    });

    expect(i18n.resolvedLanguage).toBe('en');
    expect(storage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
  });
});
