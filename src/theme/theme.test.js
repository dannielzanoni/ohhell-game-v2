// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { StorageAdapter } from '@/infrastructure/storage/storageAdapter.js';
import { applyTheme, getInitialTheme, normalizeTheme, themePalettes } from './theme.js';

function luminance(hex) {
  const channels = hex.match(/[a-f\d]{2}/gi).map((value) => parseInt(value, 16) / 255);
  const linear = channels.map((value) =>
    value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(first, second) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

describe('shell theme', () => {
  it('normalizes invalid values and migrates the legacy key', () => {
    const values = new Map([['theme', 'light']]);
    const adapter = new StorageAdapter(() => ({
      getItem: (key) => values.get(key) ?? null,
      removeItem: (key) => values.delete(key),
      setItem: (key, value) => values.set(key, value),
    }));
    expect(getInitialTheme(adapter)).toBe('light');
    expect(values.get('ohhell_theme')).toBe('light');
    expect(normalizeTheme('sepia')).toBe('dark');
  });

  it('applies and persists immediately to the shared root', () => {
    const values = new Map();
    const adapter = new StorageAdapter(() => ({
      getItem: (key) => values.get(key) ?? null,
      removeItem: (key) => values.delete(key),
      setItem: (key, value) => values.set(key, value),
    }));
    applyTheme('light', { adapter, root: document.documentElement });
    expect(document.documentElement).not.toHaveClass('dark');
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(values.get('ohhell_theme')).toBe('light');
  });

  it('bootstraps the canonical theme before the React module', () => {
    const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
    expect(html.indexOf("localStorage.getItem('ohhell_theme')"))
      .toBeLessThan(html.indexOf('src="/src/main.jsx"'));
  });

  it.each(Object.entries(themePalettes))('%s essential text pairs meet WCAG AA', (_, palette) => {
    expect(contrast(palette.background, palette.foreground)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(palette.muted, palette.mutedForeground)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(palette.primary, palette.primaryForeground)).toBeGreaterThanOrEqual(4.5);
  });
});
