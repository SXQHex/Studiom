import { defineConfig } from "@playwright/test";
import { baseConfig } from "./e2e/support/base.config";
import { desktopChromium, iphone15 } from "./e2e/support/profiles";

/**
 * Visual suite: mock data only, frozen clock (ADR-009).
 * Baselines are generated only in CI (Playwright Docker image), so local runs skip the comparison.
 */
export default defineConfig({
  ...baseConfig,
  testDir: "./e2e",
  testMatch: "**/*.visual.spec.ts",
  ignoreSnapshots: !process.env["CI"],
  expect: { toHaveScreenshot: { animations: "disabled", maxDiffPixelRatio: 0.001 } },
  projects: [desktopChromium, iphone15].flatMap((p) => (p ? [p] : [])),
});
