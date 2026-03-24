import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import authEs from "./locales/es/auth.json";
import authEn from "./locales/en/auth.json";

export const SUPPORTED_LANGUAGES = [
  { code: 'es', name: 'Español' },
  { code: 'en', name: 'English' },
  // { code: 'zh', name: '中文' },
  // { code: 'ko', name: '한국어' },
];

export const defaultNS = "auth";
export const resources = {
  es: {
    auth: authEs,
  },
  en: {
    auth: authEn,
  },
} as const;

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem("language") || "es", 
    fallbackLng: "es",
    ns: ["auth"],
    defaultNS,

    interpolation: {
      escapeValue: false, // React already safes from XSS
    },
  });

export default i18n;
