import type { Center } from "@workspace/contracts/organization"
import {
  sessionsCancel,
  sessionsGet,
  sessionsUpdate,
  type Booking,
  type Session,
} from "@workspace/contracts/schedule"

import {
  mayManageSessions,
  maySeeRoster,
  mayTakeAttendance,
} from "../rules/access"
import { countPlaces, isActive, returnCredit } from "../rules/booking"
import {
  applyChanges,
  clashProblem,
  roomProblem,
  scopeProblem,
  sessionsInScope,
} from "../rules/schedule"
import { eligibilityFor } from "./bookings"
import type { Lookups } from "./lookups"
import {
  handle,
  problem,
  refuse,
  type Ids,
  type MockContext,
  type WriteQueue,
} from "./respond"

export function sessionHandlers(
  context: MockContext,
  lookups: Lookups,
  write: WriteQueue,
  ids: Ids
) {
  const { db, auth, now } = context

  const rosterEntry = (booking: Booking) => {
    const person = db.people.findFirst((q) => q.where({ id: booking.personId }))
    const pkg = db.packages.findFirst((q) =>
      q.where({ id: booking.packageId ?? "" })
    )
    return {
      booking,
      name: person ? `${person.firstName} ${person.lastName}` : "",
      creditsLeft:
        !pkg || pkg.creditsTotal === null
          ? null
          : Math.max(0, pkg.creditsTotal - pkg.creditsUsed),
    }
  }

  /** The session, its center and the signed-in manager, or the refusal. */
  const forManager = (sessionId: string) => {
    const actorId = auth.get()
    const session = lookups.sessionById(sessionId)
    if (!session) return problem("not_found")
    const center = lookups.centerOf(session.centerId)
    if (!center) return problem("internal", "Center missing")
    if (
      actorId === null ||
      !mayManageSessions(lookups.bindingsOfPerson(actorId), center.id)
    ) {
      return problem("forbidden")
    }
    return { session, center }
  }

  const saveSessions = (list: readonly Session[]) =>
    Promise.all(
      list.map((next) =>
        db.sessions.update((q) => q.where({ id: next.id }), {
          data(draft) {
            Object.assign(draft, next)
          },
        })
      )
    )

  /** Cancels the bookings of cancelled sessions and returns their credits. */
  const releaseBookings = async (sessions: readonly Session[]) => {
    const active = sessions
      .flatMap((s) => lookups.bookingsOfSession(s.id))
      .filter(isActive)
    // One write per package: several cancelled sessions may share one.
    const returned = new Map<string, number>()
    for (const { status, packageId } of active) {
      if (status !== "waitlisted" && packageId !== null) {
        returned.set(packageId, (returned.get(packageId) ?? 0) + 1)
      }
    }
    await Promise.all(
      [...returned].map(([packageId, count]) =>
        db.packages.update((q) => q.where({ id: packageId }), {
          data(draft) {
            for (let i = 0; i < count; i++) returnCredit(draft)
          },
        })
      )
    )
    await Promise.all(
      active.map((booking) =>
        db.bookings.update((q) => q.where({ id: booking.id }), {
          data(draft) {
            draft.status = "cancelled"
          },
        })
      )
    )
  }

  /** Why the new versions cannot be saved, if one of them cannot. */
  const changeProblem = (
    next: readonly Session[],
    center: Center,
    moved: boolean,
    peopleChanged: boolean
  ) => {
    const changing = new Set(next.map((s) => s.id))
    const others = db.sessions
      .findMany((q) => q.where({ centerId: center.id }))
      .filter((s) => !changing.has(s.id))
    for (const session of next) {
      if (Date.parse(session.startsAt) <= +now()) return "in_past"
      const room = db.rooms.findFirst((q) => q.where({ id: session.roomId }))
      const booked = countPlaces(lookups.bookingsOfSession(session.id)).booked
      const roomIssue = roomProblem(session, room, booked)
      if (roomIssue) return roomIssue
      if (peopleChanged) {
        const teaches = lookups
          .bindingsOfPerson(session.instructorId)
          .some(
            (b) =>
              b.scope === "instructor" &&
              b.centerId === center.id &&
              b.role === "instructor"
          )
        if (!teaches) return "invalid_instructor"
      }
      if (moved || peopleChanged) {
        const clash = clashProblem(session, others)
        if (clash) return clash
      }
    }
    return null
  }

  return [
    handle(sessionsGet, ({ sessionId }) => {
      const session = lookups.sessionById(sessionId)
      if (!session) return problem("not_found")
      const center = lookups.centerOf(session.centerId)
      if (!center) return problem("internal", "Center missing")
      const actorId = auth.get()
      const bindings = actorId === null ? [] : lookups.bindingsOfPerson(actorId)
      const bookings = lookups.bookingsOfSession(sessionId)
      const isMember =
        actorId !== null &&
        bindings.some(
          (b) =>
            b.scope === "member" && b.organizationId === center.organizationId
        )
      const seesRoster =
        actorId !== null &&
        maySeeRoster(bindings, session, actorId, center.organizationId)
      return {
        session,
        counts: countPlaces(bookings),
        roster: seesRoster
          ? bookings.filter(isActive).map((b) => rosterEntry(b))
          : null,
        viewer:
          actorId !== null && isMember
            ? {
                booking:
                  bookings.find((b) => b.personId === actorId && isActive(b)) ??
                  null,
                eligibility: eligibilityFor(context, lookups, {
                  session,
                  center,
                  personId: actorId,
                }),
              }
            : null,
        permissions: {
          manage: mayManageSessions(bindings, center.id),
          takeAttendance:
            actorId !== null && mayTakeAttendance(bindings, session, actorId),
        },
      }
    }),

    handle(sessionsUpdate, ({ sessionId, scope, changes }) =>
      write(async () => {
        const found = forManager(sessionId)
        if (found instanceof Response) return found
        const { session, center } = found
        const blocked = scopeProblem(session, scope, now())
        if (blocked) return refuse(blocked)
        const series = lookups.seriesOf(session)
        const targets = sessionsInScope(series, session, scope, now())
        // "This and following" splits the series, so the earlier part keeps its values.
        const split =
          scope === "following" &&
          series.some((s) => s.startsAt < session.startsAt)
        const seriesId = split ? ids("ser") : session.seriesId
        const next = targets.map((target) =>
          Object.assign(
            applyChanges(target, session, changes, center.timeZone),
            { seriesId }
          )
        )
        const refusal = changeProblem(
          next,
          center,
          changes.date !== undefined ||
            changes.startTime !== undefined ||
            changes.durationMinutes !== undefined ||
            changes.roomId !== undefined,
          changes.instructorId !== undefined ||
            changes.assistantIds !== undefined
        )
        if (refusal) return refuse(refusal)
        await saveSessions(next)
        return { items: next }
      })
    ),

    handle(sessionsCancel, ({ sessionId, scope, reason }) =>
      write(async () => {
        const found = forManager(sessionId)
        if (found instanceof Response) return found
        const { session } = found
        const blocked = scopeProblem(session, scope, now())
        if (blocked) return refuse(blocked)
        const next = sessionsInScope(
          lookups.seriesOf(session),
          session,
          scope,
          now()
        ).map((target): Session =>
          Object.assign({}, target, {
            status: "cancelled" as const,
            cancelReason: reason,
          })
        )
        await saveSessions(next)
        await releaseBookings(next)
        return { items: next }
      })
    ),
  ]
}
