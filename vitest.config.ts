import { resolve } from "node:path"
import { defineConfig } from "vitest/config"

// Unit tests (ADR-009). The app gets an inline project so its Cloudflare Vite plugin stays out.
export default defineConfig({
  test: {
    projects: [
      "packages/*",
      {
        resolve: {
          alias: { "@": resolve(import.meta.dirname, "apps/web/src") },
        },
        test: {
          name: "web",
          root: "apps/web",
          include: ["src/**/*.test.{ts,tsx}"],
        },
      },
    ],
  },
})
