import { createInstance } from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import { initReactI18next } from "react-i18next"

import en from "../locales/en/common.json"
import tr from "../locales/tr/common.json"

const i18n = createInstance()

// Keep <html lang dir> in step with the active language (ADR-008).
i18n.on("languageChanged", (language) => {
  document.documentElement.lang = language
  document.documentElement.dir = i18n.dir(language)
})

export const i18nReady = i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { tr: { common: tr }, en: { common: en } },
    supportedLngs: ["tr", "en"],
    nonExplicitSupportedLngs: true,
    fallbackLng: "tr",
    defaultNS: "common",
    interpolation: { escapeValue: false },
  })

export { i18n }
