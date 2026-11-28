import { createInstance } from "i18next"
import LanguageDetector from "i18next-browser-languagedetector"
import resourcesToBackend from "i18next-resources-to-backend"
import { initReactI18next } from "react-i18next"

const i18n = createInstance()

// Keep <html lang dir> in step with the active language (ADR-008).
i18n.on("languageChanged", (language) => {
  document.documentElement.lang = language
  document.documentElement.dir = i18n.dir(language)
})

export const i18nReady = i18n
  .use(LanguageDetector)
  // Every namespace is its own chunk, loaded when a module first asks for it (ADR-008).
  .use(
    resourcesToBackend(
      (language: string, namespace: string) =>
        import(`../locales/${language}/${namespace}.json`)
    )
  )
  .use(initReactI18next)
  .init({
    ns: ["common"],
    supportedLngs: ["tr", "en"],
    nonExplicitSupportedLngs: true,
    fallbackLng: "tr",
    defaultNS: "common",
    interpolation: { escapeValue: false },
  })

export { i18n }
