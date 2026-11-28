import type { Center } from "@workspace/contracts/organization"
import {
  attendanceSet,
  bookingsCancel,
  bookingsCreate,
  seriesJoin,
  type Booking,
  type DanceRole,
  type Session,
} from "@workspace/contracts/schedule"

import { hasEnded, mayBookFor, mayTakeAttendance } from "../rules/access"
import {
  bookingEligibility,
  drawCredit,
  isFreeCancellation,
  missingChoice,
  returnCredit,
} from "../rules/booking"
import { isUpcoming, sessionsInScope } from "../rules/schedule"
import type { Lookups } from "./lookups"
import {
  handle,
  problem,
  refuse,
  type Ids,
  type MockContext,
  type WriteQueue,
} from "./respond"

/** The chosen package if it may pay, otherwise the default one. */
function pick(eligible: readonly string[], wanted: string | undefined) {
  if (wanted === undefined) return eligible[0]
  return eligible.includes(wanted) ? wanted : undefined
}

interface BookingRequest {
  session: Session
  center: Center
  personId: string
  role?: DanceRole | undefined
  seat?: string | undefined
}

/** The sessions one booking covers: this one, or the rest of its series. */
function targetsOf(
  context: MockContext,
  lookups: Lookups,
  session: Session
): Session[] {
  if (session.options.enrollment === "session") return [session]
  const upcoming = sessionsInScope(
    lookups.seriesOf(session),
    session,
    "all",
    context.now()
  )
  // A started or cancelled session still has to answer why it cannot be joined.
  return isUpcoming(session, context.now()) ? upcoming : [session]
}

/** Collects the facts from the store and asks the booking rule. */
export function eligibilityFor(
  context: MockContext,
  lookups: Lookups,
  { session, center, personId, role, seat }: BookingRequest
) {
  const { db } = context
  const { organizationId } = center
  return bookingEligibility({
    targets: targetsOf(context, lookups, session).map((target) => ({
      session: target,
      bookings: lookups.bookingsOfSession(target.id),
    })),
    timeZone: center.timeZone,
    now: context.now(),
    personId,
    isMember: lookups
      .bindingsOfPerson(personId)
      .some((b) => b.scope === "member" && b.organizationId === organizationId),
    packages: lookups.packagesOf(personId, organizationId),
    hasOpenDebt:
      db.debts.findFirst((q) =>
        q.where({ personId, organizationId, status: "open" })
      ) !== undefined,
    hasWaitlist:
      lookups.planOf(organizationId)?.features.includes("waitlist") ?? false,
    role,
    seat,
  })
}

export function bookingHandlers(
  context: MockContext,
  lookups: Lookups,
  write: WriteQueue,
  ids: Ids
) {
  const { db, auth, now } = context

  /** The session and center, if the signed-in person may book for `personId`. */
  const forBooker = (sessionId: string, personId: string) => {
    const actorId = auth.get()
    const session = lookups.sessionById(sessionId)
    if (!session) return problem("not_found")
    const center = lookups.centerOf(session.centerId)
    if (!center) return problem("internal", "Center missing")
    if (
      actorId === null ||
      !mayBookFor(
        lookups.bindingsOfPerson(actorId),
        center.id,
        actorId,
        personId
      )
    ) {
      return problem("forbidden")
    }
    return { session, center, actorId }
  }

  /** Creates bookings of one package and draws their credits in a single write. */
  const createBookings = async (
    list: readonly Omit<Booking, "id" | "createdAt">[]
  ) => {
    const items = list.map((values): Booking =>
      Object.assign({ id: ids("bkg"), createdAt: now().toISOString() }, values)
    )
    await Promise.all(items.map((item) => db.bookings.create(item)))
    const paying = items.filter((item) => item.status === "booked")
    const packageId = paying[0]?.packageId
    if (packageId) {
      await db.packages.update((q) => q.where({ id: packageId }), {
        data(draft) {
          for (const _ of paying) drawCredit(draft)
        },
      })
    }
    return items
  }

  const saveBooking = async (next: Booking) => {
    await db.bookings.update((q) => q.where({ id: next.id }), {
      data(draft) {
        Object.assign(draft, next)
      },
    })
    return next
  }

  return [
    handle(bookingsCreate, (input) =>
      write(async () => {
        const found = forBooker(input.sessionId, input.personId)
        if (found instanceof Response) return found
        const { session, center } = found
        if (session.options.enrollment === "series") {
          return refuse("series_only")
        }
        const eligibility = eligibilityFor(context, lookups, {
          ...input,
          session,
          center,
        })
        if (input.waitlist) {
          if (eligibility.allowed) return refuse("not_full")
          if (!eligibility.canWaitlist) {
            const waitable =
              eligibility.reason === "full" ||
              eligibility.reason === "role_full"
            return refuse(
              waitable ? "plan_feature" : (eligibility.reason ?? "not_full")
            )
          }
        } else if (eligibility.reason !== null) {
          return refuse(eligibility.reason)
        }
        const packageId = pick(eligibility.packageIds, input.packageId)
        if (packageId === undefined) return refuse("no_package")
        // A waiting place needs the role too (it decides when to offer), but no seat.
        const missing = missingChoice(
          session,
          input.role,
          input.waitlist ? "R1" : input.seat
        )
        if (missing) return refuse(missing)
        const [created] = await createBookings([
          {
            sessionId: session.id,
            personId: input.personId,
            packageId,
            status: input.waitlist ? "waitlisted" : "booked",
            role: session.options.roleCapacity ? (input.role ?? null) : null,
            seat:
              session.options.seatSelection && !input.waitlist
                ? (input.seat ?? null)
                : null,
            isMakeup: false,
            attendanceTakenBy: null,
          },
        ])
        return created ?? problem("internal")
      })
    ),

    handle(seriesJoin, (input) =>
      write(async () => {
        const found = forBooker(input.sessionId, input.personId)
        if (found instanceof Response) return found
        const { session, center } = found
        if (session.options.enrollment !== "series") {
          return refuse("not_a_series")
        }
        const eligibility = eligibilityFor(context, lookups, {
          ...input,
          session,
          center,
        })
        if (eligibility.reason !== null) return refuse(eligibility.reason)
        const packageId = pick(eligibility.packageIds, input.packageId)
        if (packageId === undefined) return refuse("no_package")
        const missing = missingChoice(session, input.role, input.seat)
        if (missing) return refuse(missing)
        const items = await createBookings(
          targetsOf(context, lookups, session).map((target) => ({
            sessionId: target.id,
            personId: input.personId,
            packageId,
            status: "booked" as const,
            role: target.options.roleCapacity ? (input.role ?? null) : null,
            seat: target.options.seatSelection ? (input.seat ?? null) : null,
            isMakeup: false,
            attendanceTakenBy: null,
          }))
        )
        return { items }
      })
    ),

    handle(bookingsCancel, ({ bookingId }) =>
      write(async () => {
        const booking = db.bookings.findFirst((q) => q.where({ id: bookingId }))
        if (!booking) return problem("not_found")
        const found = forBooker(booking.sessionId, booking.personId)
        if (found instanceof Response) return found
        const { session } = found
        if (booking.status === "waitlisted") {
          return saveBooking({ ...booking, status: "cancelled" })
        }
        if (booking.status !== "booked") return refuse("not_cancellable")
        if (!isUpcoming(session, now())) return refuse("session_started")
        const pkg = db.packages.findFirst((q) =>
          q.where({ id: booking.packageId ?? "" })
        )
        const template = db.packageTemplates.findFirst((q) =>
          q.where({
            id: pkg?.templateId ?? "",
            version: pkg?.templateVersion ?? 0,
          })
        )
        const free = isFreeCancellation(
          session.startsAt,
          template?.cancelHours ?? 0,
          now()
        )
        if (free && pkg) {
          await db.packages.update((q) => q.where({ id: pkg.id }), {
            data: returnCredit,
          })
        }
        return saveBooking({
          ...booking,
          status: free ? "cancelled" : "late_cancelled",
        })
      })
    ),

    handle(attendanceSet, ({ bookingId, status, reason }) =>
      write(async () => {
        const actorId = auth.get()
        const booking = db.bookings.findFirst((q) => q.where({ id: bookingId }))
        if (!booking) return problem("not_found")
        const session = lookups.sessionById(booking.sessionId)
        const center = session && lookups.centerOf(session.centerId)
        if (!session || !center) return problem("internal", "Session missing")
        if (actorId === null) return problem("forbidden")
        const bindings = lookups.bindingsOfPerson(actorId)
        const ended = hasEnded(session, now())
        if (!mayTakeAttendance(bindings, session, actorId, now())) {
          // Whoever could mark it during the session learns why they no longer can.
          const closed =
            ended && mayTakeAttendance(bindings, session, actorId, new Date(0))
          return closed ? refuse("attendance_closed") : problem("forbidden")
        }
        if (session.status === "cancelled") return refuse("session_cancelled")
        if (
          booking.status !== "booked" &&
          booking.status !== "attended" &&
          booking.status !== "no_show"
        ) {
          return refuse("attendance_not_open")
        }
        if (now().getTime() < Date.parse(session.startsAt)) {
          return refuse("attendance_not_open")
        }
        if (ended) {
          if (reason === undefined) return refuse("reason_required")
          await db.exceptions.create({
            id: ids("exc"),
            organizationId: center.organizationId,
            centerId: center.id,
            kind: "retroactive_attendance",
            actorPersonId: actorId,
            subjectPersonId: booking.personId,
            reason,
            createdAt: now().toISOString(),
          })
        }
        return saveBooking({
          ...booking,
          status,
          // Attendance always records who took it (ADR-003).
          attendanceTakenBy: status === "booked" ? null : actorId,
        })
      })
    ),
  ]
}
