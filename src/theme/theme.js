import { migrateApplicationStorage } from '@/infrastructure/storage/migrations.js';
import { storage } from '@/infrastructure/storage/storageAdapter.js';
import { storageKeys } from '@/infrastructure/storage/storageKeys.js';

export const themes = Object.freeze({ DARK: 'dark', LIGHT: 'light' });

export const themePalettes = Object.freeze({
  light: {
    background: '#ffffff', foreground: '#171717',
    muted: '#f5f5f5', mutedForeground: '#525252',
    primary: '#262626', primaryForeground: '#fafafa',
  },
  dark: {
    background: '#171717', foreground: '#fafafa',
    muted: '#262626', mutedForeground: '#a3a3a3',
    primary: '#e5e5e5', primaryForeground: '#262626',
  },
});

export function normalizeTheme(value) {
  return Object.values(themes).includes(value) ? value : themes.DARK;
}

export function getInitialTheme(adapter = storage) {
  migrateApplicationStorage(adapter);
  return normalizeTheme(adapter.getItem(storageKeys.theme));
}

export function applyTheme(theme, {
  adapter = storage,
  root = globalThis.document?.documentElement,
} = {}) {
  const normalized = normalizeTheme(theme);
  root?.classList.toggle('dark', normalized === themes.DARK);
  if (root) {
    root.dataset.theme = normalized;
    root.style.colorScheme = normalized;
  }
  adapter.setItem(storageKeys.theme, normalized);
  return normalized;
}
