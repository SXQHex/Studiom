import type { Center } from "@workspace/contracts/organization"
import {
  sessionsCancel,
  sessionsGet,
  sessionsUpdate,
  type Booking,
  type Session,
  type SessionChanges,
} from "@workspace/contracts/schedule"

import {
  hasEnded,
  managerBinding,
  mayManageSessions,
  maySeeRoster,
  mayTakeAttendance,
} from "../rules/access"
import {
  capacityWarningOf,
  countPlaces,
  isActive,
  returnCredit,
} from "../rules/booking"
import {
  applyChanges,
  clashProblem,
  roleProblem,
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

  /** Whether the person has an active teaching binding at the center. */
  const teachesAt = (
    personId: string,
    centerId: string,
    roles: readonly ("instructor" | "assistant")[]
  ) =>
    lookups
      .bindingsOfPerson(personId)
      .some(
        (b) =>
          b.scope === "instructor" &&
          b.centerId === centerId &&
          roles.includes(b.role)
      )

  const teacherProblem = (session: Session, centerId: string) => {
    if (!teachesAt(session.instructorId, centerId, ["instructor"])) {
      return "invalid_instructor"
    }
    const assistantsFit = session.assistantIds.every((id) =>
      teachesAt(id, centerId, ["instructor", "assistant"])
    )
    return assistantsFit ? null : "invalid_assistant"
  }

  /** Why the new versions cannot be saved, if one of them cannot. */
  const changeProblem = (
    targets: readonly Session[],
    next: readonly Session[],
    center: Center,
    changes: SessionChanges
  ) => {
    const peopleChanged =
      changes.instructorId !== undefined || changes.assistantIds !== undefined
    const moved =
      changes.date !== undefined ||
      changes.startTime !== undefined ||
      changes.durationMinutes !== undefined ||
      changes.roomId !== undefined
    const changing = new Set(next.map((s) => s.id))
    const others = db.sessions.all().filter((s) => !changing.has(s.id))
    const previous = new Map(targets.map((s) => [s.id, s]))
    for (const session of next) {
      const before = previous.get(session.id) ?? session
      if (Date.parse(session.startsAt) <= +now()) return "in_past"
      const room = db.rooms.findFirst((q) => q.where({ id: session.roomId }))
      const counts = countPlaces(lookups.bookingsOfSession(session.id))
      const issue =
        roomProblem(before, session, room, counts.booked) ??
        roleProblem(before, session, counts) ??
        (peopleChanged ? teacherProblem(session, center.id) : null) ??
        (moved || peopleChanged
          ? clashProblem(session, [
              ...others,
              ...next.filter((s) => s.id !== session.id),
            ])
          : null)
      if (issue) return issue
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
        capacityWarning: capacityWarningOf(session, bookings),
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
        approval: lookups.approvalOf(sessionId),
        permissions: {
          manage: mayManageSessions(bindings, center.id),
          takeAttendance:
            actorId !== null &&
            mayTakeAttendance(bindings, session, actorId, now()),
          approveAttendance:
            actorId !== null &&
            session.status !== "cancelled" &&
            hasEnded(session, now()) &&
            managerBinding(bindings, center.id) !== undefined &&
            lookups.approvalOf(sessionId) === null,
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
        // Role places cannot be added to a session without role balance.
        if (
          changes.roleCapacity !== undefined &&
          targets.some((t) => t.options.roleCapacity === null)
        ) {
          return refuse("invalid_role_capacity")
        }
        const refusal = changeProblem(targets, next, center, changes)
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
