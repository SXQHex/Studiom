import { resolve } from "node:path"
import { cloudflare } from "@cloudflare/vite-plugin"
import tailwindcss from "@tailwindcss/vite"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    // The plugin ignores `build` in wrangler.jsonc, so the deploy guard is set here.
    // It ends up in the generated config that `wrangler deploy` reads (ADR-016).
    cloudflare({
      config: { build: { command: "node ../../scripts/deploy-guard.ts" } },
    }),
  ],
  resolve: {
    alias: {
      "@": resolve(import.meta.dirname, "./src"),
    },
  },
})
