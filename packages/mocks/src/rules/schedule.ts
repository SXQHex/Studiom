import { fromDate, parseDate, toCalendarDate } from "@internationalized/date"
import type { Room } from "@workspace/contracts/organization"
import type { RuleReason } from "@workspace/contracts/rules"
import type {
  EditScope,
  Session,
  SessionChanges,
} from "@workspace/contracts/schedule"

import { addMinutes, localTimeToUtc } from "../seed/clock"
import { sessionDay } from "./booking"

/** Sessions that can still change: scheduled and not started. */
export function isUpcoming(session: Session, now: Date): boolean {
  return session.status === "scheduled" && Date.parse(session.startsAt) > +now
}

/** "Only this / this and following / all" (ADR-004). The past never changes. */
export function sessionsInScope(
  series: readonly Session[],
  session: Session,
  scope: EditScope,
  now: Date
): Session[] {
  if (scope === "this") return [session]
  return series
    .filter((s) => isUpcoming(s, now))
    .filter((s) => scope === "all" || s.startsAt >= session.startsAt)
    .toSorted((a, b) => a.startsAt.localeCompare(b.startsAt))
}

/** Why a session cannot be changed or cancelled with this scope, if it cannot. */
export function scopeProblem(
  session: Session,
  scope: EditScope,
  now: Date
): RuleReason | null {
  if (session.status === "cancelled") return "session_cancelled"
  if (!isUpcoming(session, now)) return "session_started"
  if (scope !== "this" && session.seriesId === null) return "not_a_series"
  return null
}

function pad(value: number): string {
  return String(value).padStart(2, "0")
}

function localTimeOf(utc: string, timeZone: string): string {
  const zoned = fromDate(new Date(utc), timeZone)
  return `${pad(zoned.hour)}:${pad(zoned.minute)}`
}

/**
 * The new version of one target session. A new date moves every target by the same
 * number of days, and times stay wall-clock times at the center across DST.
 */
export function applyChanges(
  target: Session,
  anchor: Session,
  changes: SessionChanges,
  timeZone: string
): Session {
  const shift =
    changes.date === undefined
      ? 0
      : parseDate(changes.date).compare(
          toCalendarDate(fromDate(new Date(anchor.startsAt), timeZone))
        )
  const date = parseDate(sessionDay(target.startsAt, timeZone)).add({
    days: shift,
  })
  const time = changes.startTime ?? localTimeOf(target.startsAt, timeZone)
  const minutes =
    changes.durationMinutes ??
    (Date.parse(target.endsAt) - Date.parse(target.startsAt)) / 60_000
  const startsAt = localTimeToUtc(date, time, timeZone)
  return {
    ...target,
    startsAt,
    endsAt: addMinutes(startsAt, minutes),
    roomId: changes.roomId ?? target.roomId,
    instructorId: changes.instructorId ?? target.instructorId,
    assistantIds: changes.assistantIds ?? target.assistantIds,
    capacity: changes.capacity ?? target.capacity,
    level: changes.level ?? target.level,
    options:
      changes.roleCapacity === undefined
        ? target.options
        : { ...target.options, roleCapacity: changes.roleCapacity },
  }
}

/**
 * A room holds as many people as its capacity, or its equipment when seats are picked.
 * An overbooked session may still change, as long as capacity does not shrink further.
 */
export function roomProblem(
  previous: Session,
  next: Session,
  room: Room | undefined,
  booked: number
): RuleReason | null {
  if (!room || room.centerId !== next.centerId || room.status !== "active") {
    return "invalid_room"
  }
  if (next.options.seatSelection && room.equipment === null) {
    return "invalid_room"
  }
  const limit = next.options.seatSelection
    ? (room.equipment?.units ?? 0)
    : room.capacity
  if (next.capacity > limit) return "over_room_limit"
  if (next.capacity < previous.capacity && next.capacity < booked) {
    return "capacity_below_booked"
  }
  return null
}

/** Each role's places fit the session and do not shrink below those booked. */
export function roleProblem(
  previous: Session,
  next: Session,
  booked: { leaders: number; followers: number }
): RuleReason | null {
  const quota = next.options.roleCapacity
  const before = previous.options.roleCapacity
  if (quota === null || before === null) return null
  const fits = (places: number, was: number, taken: number) =>
    places <= next.capacity && (places >= was || places >= taken)
  return fits(quota.leader, before.leader, booked.leaders) &&
    fits(quota.follower, before.follower, booked.followers)
    ? null
    : "invalid_role_capacity"
}

/** A room or a teacher, at any center, cannot be in two sessions at once. */
export function clashProblem(
  next: Session,
  others: readonly Session[]
): RuleReason | null {
  const overlapping = others.filter(
    (o) =>
      o.status === "scheduled" &&
      o.startsAt < next.endsAt &&
      next.startsAt < o.endsAt
  )
  if (overlapping.some((o) => o.roomId === next.roomId)) return "room_busy"
  const teachers = new Set([next.instructorId, ...next.assistantIds])
  const busy = overlapping.some((o) =>
    [o.instructorId, ...o.assistantIds].some((id) => teachers.has(id))
  )
  return busy ? "instructor_busy" : null
}
