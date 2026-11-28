import { MutationObserver, QueryClient } from "@tanstack/react-query"
import { createMockServer } from "@workspace/mocks/node"
import { afterAll, beforeAll, expect, test } from "vitest"

import { ApiRequestError } from "@/api/client"

import { sessionCancelForm, sessionEditChanges, sessionEditForm } from "./forms"
import {
  cancelSessionsMutation,
  sessionQuery,
  sessionsQuery,
  updateSessionsMutation,
} from "./queries"

const now = new Date("2026-11-30T06:00:00.000Z")
const mock = await createMockServer(now)
beforeAll(() => {
  mock.server.listen({ onUnhandledFrame: "error" })
  mock.signIn("per_mert")
})
afterAll(() => mock.server.close())

const client = new QueryClient()
const week = {
  centerId: "ctr_pro_kadikoy",
  from: "2026-12-01T00:00:00Z",
  to: "2026-12-08T00:00:00Z",
}

test("a cancelled session is refetched and cannot change again", async () => {
  const { items } = await client.fetchQuery(sessionsQuery(week))
  const target = items.find((s) => s.status === "scheduled")
  if (!target) throw new Error("no session")
  const before = await client.fetchQuery(sessionQuery(target.id))
  expect(before.permissions.manage).toBe(true)

  const cancel = new MutationObserver(client, cancelSessionsMutation)
  await cancel.mutate({ sessionId: target.id, scope: "this", reason: "Bakım" })
  expect(
    client.getQueryState(sessionQuery(target.id).queryKey)?.isInvalidated
  ).toBe(true)

  const update = new MutationObserver(client, updateSessionsMutation)
  await expect(
    update.mutate({
      sessionId: target.id,
      scope: "this",
      changes: { capacity: 4 },
    })
  ).rejects.toEqual(new ApiRequestError(409, "conflict", "session_cancelled"))
})

test("the edit form sends only what changed", () => {
  const initial = sessionEditForm.parse({
    scope: "this",
    date: "2026-12-01",
    startTime: "18:30",
    durationMinutes: 60,
    roomId: "room_pro_a",
    instructorId: "per_can",
    capacity: 24,
  })
  expect(sessionEditChanges(initial, initial)).toBeNull()
  expect(
    sessionEditChanges(initial, {
      ...initial,
      scope: "all",
      startTime: "19:00",
    })
  ).toEqual({ startTime: "19:00" })
})

test("cancelling needs a reason", () => {
  expect(
    sessionCancelForm.safeParse({ scope: "this", reason: "  " }).success
  ).toBe(false)
})
