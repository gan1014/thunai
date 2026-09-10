import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslation from './locales/en/translation.json';
import taTranslation from './locales/ta/translation.json';
import teTranslation from './locales/te/translation.json';
import hiTranslation from './locales/hi/translation.json';

export type SupportedLanguage = 'en' | 'ta' | 'te' | 'hi';

export interface LanguageOption {
  code: SupportedLanguage;
  label: string;
  nativeName: string;
  bcp47: string;
  flag?: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'ta', label: 'Tamil', nativeName: 'தமிழ்', bcp47: 'ta-IN' },
  { code: 'en', label: 'English', nativeName: 'English', bcp47: 'en-IN' },
  { code: 'te', label: 'Telugu', nativeName: 'తెలుగు', bcp47: 'te-IN' },
  { code: 'hi', label: 'Hindi', nativeName: 'हिन्दी', bcp47: 'hi-IN' },
];

export const LANGUAGE_STORAGE_KEY = 'thunai_language';

export const getSavedLanguage = (): SupportedLanguage => {
  if (typeof window === 'undefined') return 'en';
  try {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) || localStorage.getItem('thunai_preferred_language');
    if (saved === 'en' || saved === 'ta' || saved === 'te' || saved === 'hi') {
      return saved as SupportedLanguage;
    }
  } catch (err) {
    console.warn('[i18n] Failed to read language from localStorage:', err);
  }
  return 'en';
};

const initialLanguage = getSavedLanguage();

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      ta: { translation: taTranslation },
      te: { translation: teTranslation },
      hi: { translation: hiTranslation },
    },
    lng: initialLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    react: {
      useSuspense: false, // Avoid flash of blank content
    },
  });

// Synchronize document metadata and localStorage on change
i18n.on('languageChanged', (lng: string) => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
      localStorage.setItem('thunai_preferred_language', lng);
      document.documentElement.lang = lng;
      document.documentElement.dir = 'ltr';
    } catch (err) {
      console.warn('[i18n] Failed to persist language to localStorage:', err);
    }
  }
});

// Set initial document attributes
if (typeof window !== 'undefined') {
  document.documentElement.lang = initialLanguage;
  document.documentElement.dir = 'ltr';
}

export const changeAppLanguage = async (lng: SupportedLanguage): Promise<void> => {
  if (lng === i18n.language) return;
  await i18n.changeLanguage(lng);
  if (typeof window !== 'undefined') {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
    localStorage.setItem('thunai_preferred_language', lng);
    window.dispatchEvent(new CustomEvent('thunai:language_changed', { detail: { language: lng } }));
  }
};

export default i18n;
