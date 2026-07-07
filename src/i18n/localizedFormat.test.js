import { describe, expect, it } from 'vitest';
import { formatLocalizedNumber, formatLocalizedPercent } from './localizedFormat.js';

describe('localized formatting', () => {
  it('formats numbers and percentages with Intl.NumberFormat by current language', () => {
    expect(formatLocalizedNumber(1234.5, { fractionDigits: 2, language: 'en' }))
      .toBe('1,234.50');
    expect(formatLocalizedNumber(1234.5, { fractionDigits: 2, language: 'pt' }))
      .toBe('1.234,50');
    expect(formatLocalizedPercent(88.8, { language: 'en' })).toBe('88.8%');
    expect(formatLocalizedPercent(88.8, { language: 'pt' })).toBe('88,8%');
  });

  it('falls back safely for invalid values and languages', () => {
    expect(formatLocalizedNumber('nope', { fractionDigits: 2, language: 'fr' }))
      .toBe('0.00');
    expect(formatLocalizedPercent('nope', { language: 'fr' })).toBe('0.0%');
  });
});
