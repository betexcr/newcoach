import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { getLocales } from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";
import en from "./i18n/en";
import es from "./i18n/es";

const LANGUAGE_KEY = "@newcoach_language";
const SUPPORTED_LANGUAGES = ["en", "es"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

function getDeviceLanguage(): SupportedLanguage {
  const locales = getLocales();
  const deviceLang = locales[0]?.languageCode ?? "en";
  return SUPPORTED_LANGUAGES.includes(deviceLang as SupportedLanguage)
    ? (deviceLang as SupportedLanguage)
    : "en";
}

export async function getSavedLanguage(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(LANGUAGE_KEY);
  } catch {
    return null;
  }
}

export async function saveLanguage(lang: string): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  } catch {}
}

export function resolveLanguage(preference: "auto" | SupportedLanguage): SupportedLanguage {
  return preference === "auto" ? getDeviceLanguage() : preference;
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, es: { translation: es } },
  lng: getDeviceLanguage(),
  fallbackLng: "en",
  interpolation: { escapeValue: false },
  compatibilityJSON: "v4",
});

export default i18n;
