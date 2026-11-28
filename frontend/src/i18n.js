import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";

// Initialize i18next with HTTP backend to load translation files lazily

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    backend: {
      // Path where translation files are served from (public folder)
      loadPath: "/locales/{{lng}}/translation.json",
    },
    lng: localStorage.getItem("nexora_lang") || "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

export default i18n;
