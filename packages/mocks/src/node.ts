import { setupServer } from "msw/node"

import { createHandlers } from "./handlers"
import type { Scenario } from "./scenario"
import { generateDataset } from "./seed/generate"
import { createDb } from "./store"

/**
 * The mock API for unit tests in Node: the same handlers and seed as the browser worker.
 * `scenario` and `signIn` steer it the way `?scenario=` and the sample sign-in do.
 */
export async function createMockServer(now = new Date()) {
  const db = await createDb(generateDataset({ now }))
  const state: { scenario: Scenario | null; personId: string | null } = {
    scenario: null,
    personId: null,
  }
  const server = setupServer(
    ...createHandlers({
      db,
      scenario: () => state.scenario,
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
    setScenario: (scenario: Scenario | null) => {
      state.scenario = scenario
    },
    signIn: (personId: string | null) => {
      state.personId = personId
    },
  }
}
