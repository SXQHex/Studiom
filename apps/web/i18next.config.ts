import { defineConfig } from 'i18next-cli'

export default defineConfig({
  locales: [
    "tr",
    "en"
  ],
  extract: {
    input: "src/**/*.{js,jsx,mjs,ts,tsx}",
    output: "public/locales/{{language}}/{{namespace}}.json"
  }
})