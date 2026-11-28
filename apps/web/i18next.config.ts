import { defineConfig } from "i18next-cli"

export default defineConfig({
  locales: ["tr", "en"],
  extract: {
    input: "src/**/*.{ts,tsx}",
    output: "locales/{{language}}/{{namespace}}.json",
    defaultNS: "common",
    primaryLanguage: "tr",
  },
  types: {
    input: ["locales/tr/*.json"],
    output: "src/types/i18next.d.ts",
    resourcesFile: "src/types/resources.d.ts",
  },
})
