import { create } from 'zustand';
import i18n from '../i18n/config';

interface LanguageState {
  currentLanguage: string;
  setLanguage: (language: string) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  currentLanguage: localStorage.getItem('language') || 'en',
  setLanguage: (language: string) => {
    localStorage.setItem('language', language);
    i18n.changeLanguage(language);
    set({ currentLanguage: language });
  },
}));
