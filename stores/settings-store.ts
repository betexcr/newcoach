import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import i18n, { resolveLanguage, type SupportedLanguage } from "@/lib/i18n";

export type ThemePreference = "auto" | "light" | "dark";
export type LanguagePreference = "auto" | SupportedLanguage;

const THEME_KEY = "@newcoach_theme";
const LANGUAGE_KEY = "@newcoach_language";

interface SettingsState {
  theme: ThemePreference;
  language: LanguagePreference;
  isReady: boolean;
  setTheme: (theme: ThemePreference) => void;
  setLanguage: (language: LanguagePreference) => void;
  initSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  theme: "auto",
  language: "auto",
  isReady: false,

  setTheme: (theme) => {
    set({ theme });
    AsyncStorage.setItem(THEME_KEY, theme).catch(() => {});
  },

  setLanguage: (language) => {
    set({ language });
    AsyncStorage.setItem(LANGUAGE_KEY, language).catch(() => {});
    const resolved = resolveLanguage(language);
    i18n.changeLanguage(resolved);
  },

  initSettings: async () => {
    try {
      const [savedTheme, savedLang] = await Promise.all([
        AsyncStorage.getItem(THEME_KEY),
        AsyncStorage.getItem(LANGUAGE_KEY),
      ]);

      const theme = (savedTheme as ThemePreference) || "auto";
      const language = (savedLang as LanguagePreference) || "auto";
      const resolved = resolveLanguage(language);
      await i18n.changeLanguage(resolved);

      set({ theme, language, isReady: true });
    } catch {
      set({ isReady: true });
    }
  },
}));
