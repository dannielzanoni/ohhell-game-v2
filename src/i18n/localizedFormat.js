import { getResolvedLanguage } from './index.js';

const numberLocales = {
  en: 'en-US',
  pt: 'pt-BR',
};

function localeFor(language) {
  return numberLocales[getResolvedLanguage(language)] || numberLocales.en;
}

export function formatLocalizedNumber(
  value,
  {
    fractionDigits = 0,
    language,
  } = {},
) {
  const number = Number(value);
  const safeNumber = Number.isFinite(number) ? number : 0;

  return new Intl.NumberFormat(localeFor(language), {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(safeNumber);
}

export function formatLocalizedPercent(value, { language } = {}) {
  const number = Number(value);
  const safeNumber = Number.isFinite(number) ? number : 0;

  return new Intl.NumberFormat(localeFor(language), {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
    style: 'percent',
  }).format(safeNumber / 100);
}
