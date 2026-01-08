import { create } from 'zustand';
import i18n from '../i18n/config';
import { SupportedLanguage } from '../utils/currency';

interface LanguageState {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: (localStorage.getItem('language') as SupportedLanguage) || 'en',
  setLanguage: (language: SupportedLanguage) => {
    localStorage.setItem('language', language);
    i18n.changeLanguage(language);
    set({ language });
  },
}));
