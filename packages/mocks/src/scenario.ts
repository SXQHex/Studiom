/** Page states any screen can be opened in, without special setup (ADR-007). */
const scenarios = ["empty", "error", "slow", "forbidden"] as const
export type Scenario = (typeof scenarios)[number]

/** Reads `?scenario=` from a page URL. Unknown values mean the normal state. */
export function scenarioFromUrl(url: string): Scenario | null {
  const value = new URL(url).searchParams.get("scenario")
  return scenarios.find((s) => s === value) ?? null
}

/** How long the `slow` scenario holds every response, long enough to see loading states. */
export const slowDelayMs = 2_500
