import { AxeBuilder } from "@axe-core/playwright"
import type { Page } from "@playwright/test"

/** WCAG 2.2 AA rule set (ADR-013). */
const wcag22aa = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]

/** Returns one readable line per violation, so an empty array means the page passes. */
export async function axeViolations(page: Page): Promise<string[]> {
  const result = await new AxeBuilder({ page }).withTags(wcag22aa).analyze()
  return result.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.length})`)
}
