import { defineConfig } from "@playwright/test"
import { baseConfig } from "./e2e/support/base.config"
import { desktopChromium, iphone15 } from "./e2e/support/profiles"

/**
 * Visual suite: mock data only, frozen clock (ADR-009).
 * Baselines are generated only by the "Update Visual Baselines" workflow in the Playwright
 * Docker image and approved by reviewing them in the pull request (ADR-014).
 * Local runs skip the comparison.
 */
export default defineConfig({
  ...baseConfig,
  testDir: "./e2e",
  testMatch: "**/*.visual.spec.ts",
  ignoreSnapshots: !process.env["CI"],
  // A missing or different baseline fails the run; only the update workflow writes them.
  updateSnapshots: process.env["CI"] ? "none" : "missing",
  snapshotPathTemplate:
    "{testDir}/__screenshots__/{testFilePath}/{arg}-{projectName}{ext}",
  expect: {
    toHaveScreenshot: { animations: "disabled", maxDiffPixelRatio: 0.001 },
  },
  projects: [desktopChromium, iphone15].flatMap((p) => (p ? [p] : [])),
})
