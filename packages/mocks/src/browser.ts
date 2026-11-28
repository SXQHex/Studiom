import { setupWorker } from "msw/browser"

import { createHandlers } from "./handlers"
import { scenarioFromUrl } from "./scenario"
import { generateDataset } from "./seed/generate"
import { createDb } from "./store"

const authKey = "studiom.mock.personId"

/** Keeps the signed-in sample person for the tab; storage may be unavailable. */
const tabAuth = {
  get(): string | null {
    try {
      return sessionStorage.getItem(authKey)
    } catch {
      return null
    }
  },
  set(personId: string | null) {
    try {
      if (personId === null) sessionStorage.removeItem(authKey)
      else sessionStorage.setItem(authKey, personId)
    } catch {
      // Without storage the sign-in lasts until the next reload.
    }
  },
}

/**
 * Builds the mock world around the current time and starts the worker (ADR-007).
 * Data lives in memory: changes last until the page reloads, then the seed starts over.
 */
export async function startMockWorker() {
  const db = await createDb(generateDataset({ now: new Date() }))
  const worker = setupWorker(
    ...createHandlers({
      db,
      scenario: () => scenarioFromUrl(globalThis.location.href),
      auth: tabAuth,
    })
  )
  await worker.start({ onUnhandledFrame: "bypass", quiet: true })
}
