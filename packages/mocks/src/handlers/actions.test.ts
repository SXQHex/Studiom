import { peopleList } from "@workspace/contracts/person"
import {
  peopleInvite,
  peopleInviteResend,
  peopleProfile,
} from "@workspace/contracts/profile"
import {
  attendanceSet,
  bookingsCancel,
  bookingsCreate,
  seriesJoin,
  sessionsCancel,
  sessionsGet,
  sessionsUpdate,
  type Session,
} from "@workspace/contracts/schedule"
import type { Operation } from "@workspace/contracts/operation"
import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest"
import type { z } from "zod"

import { createMockServer } from "../node"
import { sessionDay } from "../rules/booking"

// A fixed Monday morning in Istanbul, so every run sees the same schedule.
const now = new Date("2026-11-30T06:00:00.000Z")
const hour = 3_600_000
const origin = "http://studiom.test"

let mock: Awaited<ReturnType<typeof createMockServer>>
beforeAll(async () => {
  mock = await createMockServer(now)
  mock.server.listen({ onUnhandledFrame: "error" })
})
afterAll(() => mock.server.close())
beforeEach(() => {
  mock.setNow(now)
  mock.signIn("per_mert")
})

async function post(op: Operation, body: unknown) {
  const response = await fetch(`${origin}${op.path}`, {
    method: "POST",
    body: JSON.stringify(body),
  })
  const data: unknown = await response.json()
  return { status: response.status, data }
}

/** Calls an operation that must succeed and parses its answer. */
async function ok<Request extends z.ZodType, Response extends z.ZodType>(
  op: Operation<Request, Response>,
  body: z.input<Request>
): Promise<z.output<Response>> {
  const result = await post(op, body)
  expect(result, JSON.stringify(result.data)).toMatchObject({ status: 200 })
  return op.response.parse(result.data)
}

/** Calls an operation that a business rule must refuse. */
async function refused<Request extends z.ZodType>(
  op: Operation<Request>,
  body: z.input<Request>,
  reason: string
) {
  expect(await post(op, body)).toEqual({
    status: 409,
    data: { code: "conflict", reason },
  })
}

const pro = "ctr_pro_kadikoy"

/** Upcoming Pro sessions of one discipline, the soonest first. */
function upcoming(disciplineId: string): Session[] {
  return mock.db.sessions.findMany(
    (q) =>
      q.where({
        centerId: pro,
        disciplineId,
        status: "scheduled",
        startsAt: (startsAt) =>
          Date.parse(startsAt) > now.getTime() + 24 * hour,
      }),
    { orderBy: { startsAt: "asc" } }
  )
}

function first<Item>(items: readonly Item[]): Item {
  const [item] = items
  if (item === undefined) throw new Error("nothing seeded")
  return item
}

/** A member with a package that pays for the session and no booking in it, signed in. */
async function freeMember(session: Session) {
  const booked = new Set(
    mock.db.bookings
      .findMany((q) => q.where({ sessionId: session.id }))
      .map((b) => b.personId)
  )
  const day = sessionDay(session.startsAt, "Europe/Istanbul")
  const pkg = first(
    mock.db.packages
      .findMany((q) => q.where({ centerId: pro, status: "active" }))
      .filter(
        (p) =>
          !booked.has(p.personId) &&
          day >= p.startsOn &&
          day < p.expiresOn &&
          (p.creditsTotal === null || p.creditsUsed < p.creditsTotal) &&
          mock.db.packageTemplates
            .findFirst((q) => q.where({ id: p.templateId }))
            ?.disciplineIds.includes(session.disciplineId) === true
      )
  )
  mock.signIn(pkg.personId)
  const detail = await ok(sessionsGet, { sessionId: session.id })
  if (!detail.viewer) throw new Error("not a member")
  return { personId: pkg.personId, eligibility: detail.viewer.eligibility }
}

const creditsUsed = (packageId: string) =>
  mock.db.packages.findFirst((q) => q.where({ id: packageId }))?.creditsUsed

/** Makes room in a session so a booking test does not depend on how full the seed is. */
function emptySession(session: Session) {
  mock.db.bookings.deleteMany((q) => q.where({ sessionId: session.id }))
}

/** A booked participant of a Pro session that has just started. */
async function started() {
  // Earlier tests empty some sessions, so take one that still has a booking.
  const booked = upcoming("dis_pro_reformer").flatMap((session) =>
    mock.db.bookings
      .findMany((q) => q.where({ sessionId: session.id, status: "booked" }))
      .map((booking) => ({ session, booking }))
  )
  const { session, booking } = first(booked)
  mock.signIn(session.instructorId)
  return { session, booking }
}

const timeAt = (session: Session) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(session.startsAt))

const seriesOf = (seriesId: string | null) =>
  mock.db.sessions.findMany((q) => q.where({ seriesId }), {
    orderBy: { startsAt: "asc" },
  })

const debtor = () => {
  const debt = first(mock.db.debts.findMany((q) => q.where({ centerId: pro })))
  return debt.personId
}

const profile = (personId: string) => ({
  organizationId: "org_pro",
  personId,
})

describe("booking", () => {
  test("a member books a seat, draws a credit and gets it back in time", async () => {
    const session = first(upcoming("dis_pro_reformer"))
    emptySession(session)
    const { personId, eligibility } = await freeMember(session)
    const packageId = first(eligibility.packageIds)
    const before = creditsUsed(packageId) ?? 0

    await refused(
      bookingsCreate,
      { sessionId: session.id, personId },
      "seat_required"
    )
    const booking = await ok(bookingsCreate, {
      sessionId: session.id,
      personId,
      seat: "R2",
    })
    expect(booking).toMatchObject({ status: "booked", seat: "R2", packageId })
    expect(creditsUsed(packageId)).toBe(before + 1)
    await refused(
      bookingsCreate,
      { sessionId: session.id, personId, seat: "R3" },
      "already_booked"
    )

    const cancelled = await ok(bookingsCancel, { bookingId: booking.id })
    expect(cancelled.status).toBe("cancelled")
    expect(creditsUsed(packageId)).toBe(before)
  })

  test("cancelling after the free window keeps the credit used", async () => {
    const session = first(upcoming("dis_pro_reformer"))
    emptySession(session)
    const { personId, eligibility } = await freeMember(session)
    const packageId = first(eligibility.packageIds)
    const booking = await ok(bookingsCreate, {
      sessionId: session.id,
      personId,
      seat: "R1",
    })
    const used = creditsUsed(packageId)
    // Reformer packages cancel free until 12 hours before.
    mock.setNow(new Date(Date.parse(session.startsAt) - 11 * hour))
    const cancelled = await ok(bookingsCancel, { bookingId: booking.id })
    expect(cancelled.status).toBe("late_cancelled")
    expect(creditsUsed(packageId)).toBe(used)
    await refused(bookingsCancel, { bookingId: booking.id }, "not_cancellable")
  })

  test("a taken seat and an unknown seat are refused", async () => {
    const session = first(upcoming("dis_pro_reformer"))
    emptySession(session)
    const one = await freeMember(session)
    await ok(bookingsCreate, {
      sessionId: session.id,
      personId: one.personId,
      seat: "R1",
    })
    const two = await freeMember(session)
    const body = { sessionId: session.id, personId: two.personId }
    await refused(bookingsCreate, { ...body, seat: "R1" }, "seat_taken")
    await refused(bookingsCreate, { ...body, seat: "R99" }, "invalid_seat")
  })

  test("a full session offers the waiting list", async () => {
    const session = first(upcoming("dis_pro_reformer"))
    emptySession(session)
    await mock.db.sessions.update((q) => q.where({ id: session.id }), {
      data(draft) {
        draft.capacity = 1
      },
    })
    const one = await freeMember(session)
    await ok(bookingsCreate, {
      sessionId: session.id,
      personId: one.personId,
      seat: "R1",
    })
    const two = await freeMember(session)
    expect(two.eligibility).toMatchObject({
      allowed: false,
      reason: "full",
      canWaitlist: true,
    })
    const used = creditsUsed(first(two.eligibility.packageIds))
    const waiting = await ok(bookingsCreate, {
      sessionId: session.id,
      personId: two.personId,
      waitlist: true,
    })
    expect(waiting).toMatchObject({ status: "waitlisted", seat: null })
    // Waiting reserves no credit, and leaving costs nothing.
    expect(creditsUsed(first(two.eligibility.packageIds))).toBe(used)
    const left = await ok(bookingsCancel, { bookingId: waiting.id })
    expect(left.status).toBe("cancelled")
  })

  test("role balance gives each role half of the places", async () => {
    const session = first(upcoming("dis_pro_bachata"))
    emptySession(session)
    await mock.db.sessions.update((q) => q.where({ id: session.id }), {
      data(draft) {
        draft.capacity = 2
      },
    })
    const one = await freeMember(session)
    const body = { sessionId: session.id, personId: one.personId }
    await refused(bookingsCreate, body, "role_required")
    await ok(bookingsCreate, { ...body, role: "leader" })
    const two = await freeMember(session)
    const second = { sessionId: session.id, personId: two.personId }
    await refused(bookingsCreate, { ...second, role: "leader" }, "role_full")
    await ok(bookingsCreate, { ...second, role: "follower" })
  })

  test("a series is joined as a whole, never one session at a time", async () => {
    const [session] = upcoming("dis_pro_salsa")
    if (!session) throw new Error("no salsa")
    const series = mock.db.sessions.findMany((q) =>
      q.where({
        seriesId: session.seriesId,
        startsAt: (startsAt) => Date.parse(startsAt) > now.getTime(),
      })
    )
    for (const each of series) emptySession(each)
    // Give one member a package that covers the whole series.
    const member = first(
      mock.db.packages.findMany((q) =>
        q.where({ templateId: "tpl_pro_dance8", status: "active" })
      )
    )
    await mock.db.packages.update((q) => q.where({ id: member.id }), {
      data(draft) {
        draft.creditsTotal = 100
        draft.expiresOn = "2027-03-01"
      },
    })
    mock.signIn(member.personId)
    const body = {
      sessionId: session.id,
      personId: member.personId,
      packageId: member.id,
      role: "leader" as const,
    }
    await refused(bookingsCreate, body, "series_only")
    // Bookings of earlier sessions would count as "already booked".
    mock.db.bookings.deleteMany((q) => q.where({ personId: member.personId }))
    const before = creditsUsed(member.id) ?? 0
    const joined = await ok(seriesJoin, body)
    expect(joined.items.length).toBeGreaterThan(1)
    expect(creditsUsed(member.id)).toBe(before + joined.items.length)
  })

  test.each(["per_ayse", "per_can", null])(
    "only the member or their center's desk may book, not %s",
    async (stranger) => {
      const session = first(upcoming("dis_pro_reformer"))
      const { personId } = await freeMember(session)
      mock.signIn(stranger)
      const result = await post(bookingsCreate, {
        sessionId: session.id,
        personId,
        seat: "R1",
      })
      expect(result.status).toBe(403)
    }
  )
})

describe("attendance", () => {
  test("presence opens at the start and records who took it", async () => {
    const { session, booking } = await started()
    const mark = { bookingId: booking.id, status: "attended" as const }
    await refused(attendanceSet, mark, "attendance_not_open")
    mock.setNow(new Date(session.startsAt))
    const marked = await ok(attendanceSet, mark)
    expect(marked.attendanceTakenBy).toBe(session.instructorId)
    await refused(
      attendanceSet,
      { ...mark, status: "no_show" },
      "attendance_not_open"
    )
    const undone = await ok(attendanceSet, { ...mark, status: "booked" })
    expect(undone.attendanceTakenBy).toBeNull()
  })

  test("marking after the day needs a reason and records an exception", async () => {
    const { session, booking } = await started()
    mock.setNow(new Date(Date.parse(session.startsAt) + 30 * hour))
    const mark = { bookingId: booking.id, status: "no_show" as const }
    await refused(attendanceSet, mark, "reason_required")
    await ok(attendanceSet, { ...mark, reason: "Liste geç girildi" })
    expect(mock.db.exceptions.all()).toContainEqual(
      expect.objectContaining({
        kind: "retroactive_attendance",
        actorPersonId: session.instructorId,
        subjectPersonId: booking.personId,
        reason: "Liste geç girildi",
      })
    )
  })

  test("a member cannot take attendance", async () => {
    const { session, booking } = await started()
    mock.setNow(new Date(session.startsAt))
    mock.signIn(booking.personId)
    const result = await post(attendanceSet, {
      bookingId: booking.id,
      status: "attended",
    })
    expect(result.status).toBe(403)
  })
})

describe("session detail", () => {
  test("a teacher sees the roster without money, a member only themselves", async () => {
    const session = first(upcoming("dis_pro_reformer"))
    mock.signIn(session.instructorId)
    const teacher = await ok(sessionsGet, { sessionId: session.id })
    expect(teacher.roster?.length).toBeGreaterThan(0)
    expect(teacher.permissions).toEqual({
      manage: false,
      takeAttendance: true,
    })
    const participant = first(teacher.roster ?? [])
    mock.signIn(participant.booking.personId)
    const member = await ok(sessionsGet, { sessionId: session.id })
    expect(member.roster).toBeNull()
    expect(member.viewer?.booking?.id).toBe(participant.booking.id)
  })
})

describe("recurrence editing", () => {
  test("only this session changes and stays in its series", async () => {
    const [, session] = upcoming("dis_pro_tango")
    if (!session) throw new Error("no tango")
    const { items } = await ok(sessionsUpdate, {
      sessionId: session.id,
      scope: "this",
      changes: { startTime: "21:00" },
    })
    expect(items).toHaveLength(1)
    expect(items[0]?.seriesId).toBe(session.seriesId)
    expect(items.map(timeAt)).toEqual(["21:00"])
  })

  test("this and following splits the series and leaves the earlier part", async () => {
    const [, , session] = upcoming("dis_pro_salsa")
    if (!session) throw new Error("no salsa")
    const before = seriesOf(session.seriesId).filter(
      (s) => s.startsAt < session.startsAt
    )
    const { items } = await ok(sessionsUpdate, {
      sessionId: session.id,
      scope: "following",
      changes: { durationMinutes: 75 },
    })
    expect(items.length).toBeGreaterThan(1)
    expect(new Set(items.map((s) => s.seriesId)).size).toBe(1)
    expect(items[0]?.seriesId).not.toBe(session.seriesId)
    expect(seriesOf(session.seriesId)).toEqual(before)
  })

  test("a new date moves every session in scope by the same days", async () => {
    const [session] = upcoming("dis_pro_tango")
    if (!session) throw new Error("no tango")
    const day = sessionDay(session.startsAt, "Europe/Istanbul")
    const nextDay = new Date(Date.parse(`${day}T00:00:00Z`) + 24 * hour)
      .toISOString()
      .slice(0, 10)
    const { items } = await ok(sessionsUpdate, {
      sessionId: session.id,
      scope: "all",
      changes: { date: nextDay },
    })
    for (const changed of items) {
      expect([3, 5]).toContain(new Date(changed.startsAt).getUTCDay())
    }
  })

  test("clashes, room limits and the past are refused", async () => {
    const session = first(upcoming("dis_pro_reformer"))
    const change = { sessionId: session.id, scope: "this" as const }
    await refused(
      sessionsUpdate,
      { ...change, changes: { capacity: 30 } },
      "over_room_limit"
    )
    await refused(
      sessionsUpdate,
      { ...change, changes: { roomId: "room_pro_a" } },
      "invalid_room"
    )
    await refused(
      sessionsUpdate,
      { ...change, changes: { date: "2026-11-01" } },
      "in_past"
    )
    const salsa = first(upcoming("dis_pro_salsa"))
    await refused(
      sessionsUpdate,
      {
        sessionId: first(upcoming("dis_pro_bachata")).id,
        scope: "this",
        changes: {
          date: sessionDay(salsa.startsAt, "Europe/Istanbul"),
          startTime: "18:30",
          roomId: salsa.roomId,
        },
      },
      "room_busy"
    )
  })

  test("cancelling a session releases its bookings and returns credits", async () => {
    const session = upcoming("dis_pro_reformer")[2]
    if (!session) throw new Error("no reformer")
    const booking = first(
      mock.db.bookings.findMany((q) =>
        q.where({ sessionId: session.id, status: "booked" })
      )
    )
    const used = creditsUsed(booking.packageId ?? "") ?? 0
    const { items } = await ok(sessionsCancel, {
      sessionId: session.id,
      scope: "this",
      reason: "Eğitim günü",
    })
    expect(items[0]).toMatchObject({
      status: "cancelled",
      cancelReason: "Eğitim günü",
    })
    expect(creditsUsed(booking.packageId ?? "")).toBe(used - 1)
    expect(
      mock.db.bookings.findMany((q) =>
        q.where({ sessionId: session.id, status: "booked" })
      )
    ).toEqual([])
  })

  test("an instructor cannot edit the schedule", async () => {
    const session = first(upcoming("dis_pro_reformer"))
    mock.signIn(session.instructorId)
    const result = await post(sessionsCancel, {
      sessionId: session.id,
      scope: "this",
      reason: "Hastayım",
    })
    expect(result.status).toBe(403)
  })
})

describe("people", () => {
  test("a manager sees money, an instructor sees no profile", async () => {
    const personId = debtor()
    const full = await ok(peopleProfile, profile(personId))
    expect(full.finance?.debts.length).toBeGreaterThan(0)
    expect(full.readOnly).toBe(false)
    mock.signIn("per_can")
    expect((await post(peopleProfile, profile(personId))).status).toBe(403)
  })

  test("a manager of another organization sees nothing", async () => {
    mock.signIn("per_ayse")
    expect((await post(peopleProfile, profile(debtor()))).status).toBe(403)
  })

  test("a center of the same organization sees only its own members", async () => {
    const berliner = first(
      mock.db.bindings
        .findMany((q) => q.where({ organizationId: "org_business" }))
        .filter(
          (b) => b.scope === "member" && b.homeCenterId === "ctr_biz_berlin"
        )
    )
    const body = {
      organizationId: "org_business",
      personId: berliner.personId,
    }
    mock.signIn("per_anna")
    expect((await ok(peopleProfile, body)).readOnly).toBe(false)
    mock.signIn("per_kerem")
    expect((await post(peopleProfile, body)).status).toBe(403)
    // The organization looks on, read-only (ADR-003).
    mock.signIn("per_ozan")
    expect((await ok(peopleProfile, body)).readOnly).toBe(true)
  })

  test("an invitation creates an invited member that the list can filter", async () => {
    const body = {
      centerId: pro,
      firstName: "Defne",
      lastName: "Aral",
      email: "defne.aral@example.com",
    }
    const { person, binding } = await ok(peopleInvite, body)
    expect(person.accountStatus).toBe("invited")
    expect(binding.status).toBe("invited")
    await refused(peopleInvite, body, "already_member")
    const invited = await ok(peopleList, {
      organizationId: "org_pro",
      accountStatus: "invited",
    })
    expect(invited.items.map((p) => p.id)).toContain(person.id)
    await ok(peopleInviteResend, {
      organizationId: "org_pro",
      personId: person.id,
    })
    await refused(
      peopleInviteResend,
      { organizationId: "org_pro", personId: debtor() },
      "not_invited"
    )
  })

  test("a full plan refuses another invitation", async () => {
    mock.signIn("per_ayse")
    await mock.db.plans.update((q) => q.where({ id: "starter" }), {
      data(draft) {
        draft.limits.activeStudents = { kind: "limited", max: 97 }
      },
    })
    await refused(
      peopleInvite,
      {
        centerId: "ctr_starter_moda",
        firstName: "Ada",
        lastName: "Ersoy",
        email: "ada.ersoy@example.com",
      },
      "plan_limit"
    )
  })
})
