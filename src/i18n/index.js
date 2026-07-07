import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en.js';
import { pt } from './locales/pt.js';
import { storage } from '@/infrastructure/storage/storageAdapter.js';
import { storageKeys } from '@/infrastructure/storage/storageKeys.js';

export const LANGUAGE_STORAGE_KEY = storageKeys.language;

export const languageOptions = [
  {
    flagCode: 'us',
    labelKey: 'settings.english',
    shortLabel: 'EN',
    value: 'en',
  },
  {
    flagCode: 'br',
    labelKey: 'settings.portuguese',
    shortLabel: 'PT',
    value: 'pt',
  },
];

function getStoredLanguage() {
  if (typeof window === 'undefined') {
    return 'en';
  }

  const storedLanguage = storage.getItem(LANGUAGE_STORAGE_KEY);

  return languageOptions.some((language) => language.value === storedLanguage)
    ? storedLanguage
    : 'en';
}

i18n.use(initReactI18next).init({
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  lng: getStoredLanguage(),
  resources: {
    en: { translation: en },
    pt: { translation: pt },
  },
  supportedLngs: languageOptions.map((language) => language.value),
});

i18n.on('languageChanged', (language) => {
  if (typeof window !== 'undefined') {
    storage.setItem(LANGUAGE_STORAGE_KEY, language);
  }
});

export function getResolvedLanguage(language = i18n.resolvedLanguage || i18n.language) {
  const normalizedLanguage = language?.split('-')[0];

  return languageOptions.some((option) => option.value === normalizedLanguage)
    ? normalizedLanguage
    : 'en';
}

export function setAppLanguage(language) {
  const nextLanguage = languageOptions.some((option) => option.value === language)
    ? language
    : 'en';

  return i18n.changeLanguage(nextLanguage);
}

export default i18n;
