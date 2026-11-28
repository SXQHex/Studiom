import { MutationObserver, QueryClient } from "@tanstack/react-query"
import { createMockServer } from "@workspace/mocks/node"
import { afterAll, beforeAll, expect, test } from "vitest"

import { ApiRequestError } from "@/api/client"
import { sessionQuery } from "@/domain/sessions/queries"

import {
  approveAttendanceMutation,
  attendanceMutation,
  bookMutation,
  cancelBookingMutation,
  joinSeriesMutation,
} from "./queries"

const now = new Date("2026-11-30T06:00:00.000Z")
const mock = await createMockServer(now)
beforeAll(() => mock.server.listen({ onUnhandledFrame: "error" }))
afterAll(() => mock.server.close())

const client = new QueryClient()

/** A booking of an upcoming Pro reformer session. */
function seeded() {
  const sessions = mock.db.sessions.findMany(
    (q) =>
      q.where({
        disciplineId: "dis_pro_reformer",
        status: "scheduled",
        startsAt: (startsAt) => startsAt > "2026-12-01",
      }),
    { orderBy: { startsAt: "asc" } }
  )
  for (const session of sessions) {
    const booking = mock.db.bookings.findFirst((q) =>
      q.where({ sessionId: session.id, status: "booked" })
    )
    if (booking) return { session, booking }
  }
  throw new Error("nothing booked")
}

test("a member cancels, sees the session again and books it again", async () => {
  const { session, booking } = seeded()
  mock.signIn(booking.personId)
  const cancel = new MutationObserver(client, cancelBookingMutation)
  expect((await cancel.mutate({ bookingId: booking.id })).status).toBe(
    "cancelled"
  )
  const detail = await client.fetchQuery(sessionQuery(session.id))
  expect(detail.viewer?.eligibility.allowed).toBe(true)

  const book = new MutationObserver(client, bookMutation)
  const input = {
    sessionId: session.id,
    personId: booking.personId,
    seat: booking.seat ?? "R1",
  }
  expect((await book.mutate(input)).status).toBe("booked")
  await expect(book.mutate(input)).rejects.toMatchObject({
    reason: "already_booked",
  })
})

test("refusals of the other actions reach the screen with their rule", async () => {
  const { session, booking } = seeded()
  mock.signIn(session.instructorId)
  const mark = new MutationObserver(client, attendanceMutation)
  await expect(
    mark.mutate({ bookingId: booking.id, status: "attended" })
  ).rejects.toEqual(new ApiRequestError(409, "conflict", "attendance_not_open"))
  mock.signIn(booking.personId)
  const join = new MutationObserver(client, joinSeriesMutation)
  await expect(
    join.mutate({ sessionId: session.id, personId: booking.personId })
  ).rejects.toMatchObject({ reason: "not_a_series" })
})

test("a manager approves an ended session and the screen sees it", async () => {
  const { session } = seeded()
  mock.setNow(new Date(session.endsAt))
  mock.signIn("per_mert")
  const before = await client.fetchQuery({
    ...sessionQuery(session.id),
    staleTime: 0,
  })
  expect(before.permissions.approveAttendance).toBe(true)
  const approve = new MutationObserver(client, approveAttendanceMutation)
  await approve.mutate({ sessionId: session.id })
  const after = await client.fetchQuery({
    ...sessionQuery(session.id),
    staleTime: 0,
  })
  expect(after.approval?.byPersonId).toBe("per_mert")
  mock.setNow(now)
})
