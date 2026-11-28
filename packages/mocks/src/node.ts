import { setupServer } from "msw/node"

import { createHandlers } from "./handlers"
import type { Scenario } from "./scenario"
import { generateDataset } from "./seed/generate"
import { createDb } from "./store"

/**
 * The mock API for unit tests in Node: the same handlers and seed as the browser worker.
 * `setScenario` and `signIn` steer it the way `?scenario=` and the sample sign-in do.
 * Time stands at `now` until `setNow` moves it.
 */
export async function createMockServer(now = new Date()) {
  let clock = now
  const db = await createDb(generateDataset({ now }))
  const state: { scenario: Scenario | null; personId: string | null } = {
    scenario: null,
    personId: null,
  }
  const server = setupServer(
    ...createHandlers({
      db,
      scenario: () => state.scenario,
      now: () => clock,
      auth: {
        get: () => state.personId,
        set: (personId) => {
          state.personId = personId
        },
      },
    })
  )
  return {
    server,
    db,
    setNow: (instant: Date) => {
      clock = instant
    },
    setScenario: (scenario: Scenario | null) => {
      state.scenario = scenario
    },
    signIn: (personId: string | null) => {
      state.personId = personId
    },
  }
}
