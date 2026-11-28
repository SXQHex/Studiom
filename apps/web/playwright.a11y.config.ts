import { defineConfig } from "@playwright/test"
import { baseConfig } from "./e2e/support/base.config"
import { desktopChromium } from "./e2e/support/profiles"

/** Accessibility suite: axe with WCAG 2.2 AA tags in dark and light themes (ADR-009, ADR-013). */
export default defineConfig({
  ...baseConfig,
  testDir: "./e2e",
  testMatch: "**/*.a11y.spec.ts",
  projects: desktopChromium
    ? [
        { ...desktopChromium, name: "a11y-dark" },
        {
          ...desktopChromium,
          name: "a11y-light",
          use: { ...desktopChromium.use, colorScheme: "light" },
        },
      ]
    : [],
})
