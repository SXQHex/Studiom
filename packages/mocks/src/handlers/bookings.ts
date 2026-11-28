import type { Center } from "@workspace/contracts/organization"
import {
  attendanceApprove,
  attendanceSet,
  bookingsCancel,
  bookingsCreate,
  seriesJoin,
  seriesPreview,
  type Booking,
  type DanceRole,
  type Session,
} from "@workspace/contracts/schedule"

import {
  hasEnded,
  managerBinding,
  mayBookFor,
  mayTakeAttendance,
} from "../rules/access"
import {
  bookingEligibility,
  drawCredit,
  isFreeCancellation,
  isFullness,
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
  /** The course as a whole (join, preview) rather than this session alone. */
  course?: boolean | undefined
  overrideClosed?: boolean | undefined
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
  // Closed sessions are not part of the course.
  return isUpcoming(session, context.now())
    ? upcoming.filter((s) => s.sales === "open")
    : [session]
}

/** Collects the facts from the store and asks the booking rule. */
export function eligibilityFor(
  context: MockContext,
  lookups: Lookups,
  {
    session,
    center,
    personId,
    role,
    seat,
    course = false,
    overrideClosed = false,
  }: BookingRequest
) {
  const { db } = context
  const { organizationId } = center
  return bookingEligibility({
    targets: (course ? targetsOf(context, lookups, session) : [session]).map(
      (target) => ({
        session: target,
        bookings: lookups.bookingsOfSession(target.id),
      })
    ),
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
    overrideClosed,
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
        const { session, center, actorId } = found
        const manager = managerBinding(
          lookups.bindingsOfPerson(actorId),
          center.id
        )
        let eligibility = eligibilityFor(context, lookups, {
          ...input,
          session,
          center,
        })
        // A closed session takes no booking, except from the center manager with a reason.
        const override = eligibility.reason === "session_closed"
        if (override) {
          if (!manager) return refuse("session_closed")
          if (input.reason === undefined) return refuse("reason_required")
          eligibility = eligibilityFor(context, lookups, {
            ...input,
            session,
            center,
            overrideClosed: true,
          })
        }
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
            priority: false,
            attendanceTakenBy: null,
          },
        ])
        if (override && manager && input.reason !== undefined) {
          await db.audit.create({
            id: ids("aud"),
            organizationId: center.organizationId,
            centerId: center.id,
            kind: "booking_override",
            actorPersonId: actorId,
            actorBindingId: manager.id,
            sessionId: session.id,
            subjectPersonId: input.personId,
            reason: input.reason,
            createdAt: now().toISOString(),
          })
        }
        return created ?? problem("internal")
      })
    ),

    handle(seriesPreview, (input) => {
      const found = forBooker(input.sessionId, input.personId)
      if (found instanceof Response) return found
      const { session, center } = found
      if (session.options.enrollment !== "series") return refuse("not_a_series")
      const eligibility = eligibilityFor(context, lookups, {
        ...input,
        session,
        center,
        course: true,
      })
      const full = new Set(eligibility.fullSessionIds)
      return {
        eligibility,
        fullSessions: targetsOf(context, lookups, session).filter((s) =>
          full.has(s.id)
        ),
      }
    }),

    handle(seriesJoin, (input) =>
      write(async () => {
        const found = forBooker(input.sessionId, input.personId)
        if (found instanceof Response) return found
        const { session, center, actorId } = found
        if (session.options.enrollment !== "series") {
          return refuse("not_a_series")
        }
        const manager = managerBinding(
          lookups.bindingsOfPerson(actorId),
          center.id
        )
        if (input.confirmFull && !manager) return problem("forbidden")
        const eligibility = eligibilityFor(context, lookups, {
          ...input,
          session,
          center,
          course: true,
        })
        const full = new Set(eligibility.fullSessionIds)
        // Only fullness can be confirmed; every other rule still holds.
        const confirmed = input.confirmFull && isFullness(eligibility.reason)
        if (eligibility.reason !== null && !confirmed) {
          return refuse(eligibility.reason)
        }
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
            // A full session has no seat to give.
            seat:
              target.options.seatSelection && !full.has(target.id)
                ? (input.seat ?? null)
                : null,
            isMakeup: false,
            priority: true,
            attendanceTakenBy: null,
          }))
        )
        if (manager && full.size > 0) {
          await Promise.all(
            [...full].map((sessionId) =>
              db.audit.create({
                id: ids("aud"),
                organizationId: center.organizationId,
                centerId: center.id,
                kind: "capacity_override",
                actorPersonId: actorId,
                actorBindingId: manager.id,
                sessionId,
                subjectPersonId: input.personId,
                reason: null,
                createdAt: now().toISOString(),
              })
            )
          )
        }
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

    handle(attendanceApprove, ({ sessionId }) =>
      write(async () => {
        const actorId = auth.get()
        const session = lookups.sessionById(sessionId)
        if (!session) return problem("not_found")
        const center = lookups.centerOf(session.centerId)
        if (!center) return problem("internal", "Center missing")
        const manager =
          actorId === null
            ? undefined
            : managerBinding(lookups.bindingsOfPerson(actorId), center.id)
        if (actorId === null || !manager) return problem("forbidden")
        if (session.status === "cancelled") return refuse("session_cancelled")
        if (!hasEnded(session, now())) return refuse("attendance_not_open")
        if (lookups.approvalOf(sessionId)) return refuse("already_approved")
        const at = now().toISOString()
        await db.audit.create({
          id: ids("aud"),
          organizationId: center.organizationId,
          centerId: center.id,
          kind: "attendance_approved",
          actorPersonId: actorId,
          actorBindingId: manager.id,
          sessionId,
          subjectPersonId: null,
          reason: null,
          createdAt: at,
        })
        return { byPersonId: actorId, at }
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
          const manager = managerBinding(bindings, center.id)
          if (!manager) return problem("forbidden")
          await db.audit.create({
            id: ids("aud"),
            organizationId: center.organizationId,
            centerId: center.id,
            kind: "attendance_changed",
            actorPersonId: actorId,
            actorBindingId: manager.id,
            sessionId: session.id,
            subjectPersonId: booking.personId,
            reason,
            createdAt: now().toISOString(),
          })
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
