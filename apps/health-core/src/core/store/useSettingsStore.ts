import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import i18n from '@/core/i18n';

type Theme = 'dark' | 'light' | 'system';
type Language = string;

interface SettingsState {
  theme: Theme;
  language: Language;
  setTheme: (theme: Theme) => void;
  setLanguage: (lang: Language) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      language: 'es',
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },
      setLanguage: (language) => {
        set({ language });
        i18n.changeLanguage(language);
        localStorage.setItem("language", language); // For i18n initialization
      },
    }),
    {
      name: 'healthcore-settings',
    }
  )
);

// Helper function to apply dark mode class
export const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  const isSystemDark = globalThis.matchMedia('(prefers-color-scheme: dark)').matches;
  
  root.classList.remove('dark');
  if (theme === 'dark' || (theme === 'system' && isSystemDark)) {
    root.classList.add('dark');
  }
};
