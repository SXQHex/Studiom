import type { Page } from "@playwright/test"

/** Frozen "now" for the visual suite only (ADR-007, ADR-009). */
const visualNow = new Date("2026-11-04T14:20:00+03:00")

export async function freezeClock(page: Page) {
  await page.clock.install({ time: visualNow })
}
