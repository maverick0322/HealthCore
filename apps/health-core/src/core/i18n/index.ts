import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import authEs from "./locales/es/auth.json";
import authEn from "./locales/en/auth.json";
import onboardingEs from "./locales/es/onboarding.json";
import onboardingEn from "./locales/en/onboarding.json";
import patientEs from "./locales/es/patient.json";
import patientEn from "./locales/en/patient.json";
import nutritionistEs from "./locales/es/nutritionist.json";
import nutritionistEn from "./locales/en/nutritionist.json";

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
    onboarding: onboardingEs,
    patient: patientEs,
    nutritionist: nutritionistEs,
  },
  en: {
    auth: authEn,
    onboarding: onboardingEn,
    patient: patientEn,
    nutritionist: nutritionistEn,
  },
} as const;

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem("language") || "es",
    fallbackLng: "es",
    ns: ["auth", "onboarding", "patient", "nutritionist"],
    defaultNS,

    interpolation: {
      escapeValue: false, // React already safes from XSS
    },
  });

export default i18n;
