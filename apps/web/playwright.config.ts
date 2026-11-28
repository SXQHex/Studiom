import { defineConfig, type Project } from "@playwright/test";
import { baseConfig } from "./e2e/support/base.config";
import { desktopChromium, profiles } from "./e2e/support/profiles";

/** Behavior suite (e2e) on all four profiles, plus the smoke project (en, light). */
export default defineConfig({
  ...baseConfig,
  testDir: "./e2e",
  testIgnore: ["**/*.visual.spec.ts", "**/*.a11y.spec.ts"],
  projects: [
    ...profiles.map((p): Project => Object.assign({}, p, { grepInvert: /@smoke/ })),
    {
      name: "smoke",
      grep: /@smoke/,
      use: { ...desktopChromium?.use, locale: "en-US", colorScheme: "light" },
    },
  ],
});
