import { z } from "zod"

import { defineOperation, listResponse } from "./operation"
import { enrollment, sessionLevel } from "./organization"
import { calendarDate, id, localTime, utcDateTime } from "./primitives"
import { ruleReason } from "./rules"

export const roleCapacity = z.object({
  leader: z.number().int().nonnegative(),
  follower: z.number().int().nonnegative(),
})
export type RoleCapacity = z.infer<typeof roleCapacity>

/** The single scheduling concept; recurrence is a property of a session (ADR-004). */
export const session = z.object({
  id,
  centerId: id,
  roomId: id,
  disciplineId: id,
  instructorId: id,
  assistantIds: z.array(id),
  startsAt: utcDateTime,
  endsAt: utcDateTime,
  capacity: z.number().int().positive(),
  level: sessionLevel,
  options: z.object({
    enrollment,
    /** Places per dance role, entered by hand; null without role balance. */
    roleCapacity: roleCapacity.nullable(),
    seatSelection: z.boolean(),
    levelPrerequisite: sessionLevel.nullable(),
  }),
  /** Sessions of one weekly series share the series id. */
  seriesId: id.nullable(),
  status: z.enum(["scheduled", "cancelled"]),
  cancelReason: z.string().nullable(),
})
export type Session = z.infer<typeof session>

export const bookingStatus = z.enum([
  "booked",
  "waitlisted",
  "cancelled",
  /** Cancelled after the free window: the credit stays used. */
  "late_cancelled",
  "attended",
  "no_show",
])
export type BookingStatus = z.infer<typeof bookingStatus>

export const danceRole = z.enum(["leader", "follower"])
export type DanceRole = z.infer<typeof danceRole>

export const booking = z.object({
  id,
  sessionId: id,
  personId: id,
  /** The sold package the booking draws from; null for a trial seat. */
  packageId: id.nullable(),
  status: bookingStatus,
  role: danceRole.nullable(),
  seat: z.string().nullable(),
  /** A makeup fills capacity but does not count toward role balance (ADR-004). */
  isMakeup: z.boolean(),
  /** A course enrollment has priority over single bookings (ADR-021). */
  priority: z.boolean(),
  /** Attendance always records who took it ("X aldı", ADR-003). */
  attendanceTakenBy: id.nullable(),
  createdAt: utcDateTime,
})
export type Booking = z.infer<typeof booking>

export const sessionsList = defineOperation("sessions_list_v1", {
  request: z.object({
    centerId: id.optional(),
    instructorId: id.optional(),
    personId: id.optional(),
    from: utcDateTime,
    to: utcDateTime,
  }),
  response: listResponse(session),
})

export const bookingsList = defineOperation("bookings_list_v1", {
  request: z.object({ sessionId: id.optional(), personId: id.optional() }),
  response: listResponse(booking),
})

/** Which sessions of a series a change applies to (ADR-004). */
export const editScope = z.enum(["this", "following", "all"])
export type EditScope = z.infer<typeof editScope>

/** New values for a session. A time is a wall-clock time at the center. */
export const sessionChanges = z
  .object({
    date: calendarDate,
    startTime: localTime,
    durationMinutes: z.number().int().min(15).max(480),
    roomId: id,
    instructorId: id,
    assistantIds: z.array(id),
    capacity: z.number().int().positive(),
    level: sessionLevel,
    /** Only for sessions with role balance. */
    roleCapacity,
  })
  .partial()
  .refine((changes) => Object.keys(changes).length > 0, {
    message: "Nothing to change",
  })
export type SessionChanges = z.infer<typeof sessionChanges>

/** Whether a person can book (or join the series of) a session, and why not. */
export const eligibility = z.object({
  unit: enrollment,
  allowed: z.boolean(),
  reason: ruleReason.nullable(),
  canWaitlist: z.boolean(),
  /** Packages that can pay for it, the one used by default first. */
  packageIds: z.array(id),
  warnings: z.array(z.enum(["open_debt"])),
  /** Sessions with no place left (overall or for the chosen role). */
  fullSessionIds: z.array(id),
})
export type Eligibility = z.infer<typeof eligibility>

/** One participant as staff and teachers see them: no money information (ADR-003). */
export const rosterEntry = z.object({
  booking,
  name: z.string(),
  /** Credits left on the paying package; null when unlimited or without package. */
  creditsLeft: z.number().int().nonnegative().nullable(),
})
export type RosterEntry = z.infer<typeof rosterEntry>

export const attendanceApproval = z.object({
  byPersonId: id,
  at: utcDateTime,
})
export type AttendanceApproval = z.infer<typeof attendanceApproval>

/** How many places are taken beyond the limits; resolves when numbers fit again. */
export const capacityWarning = z.object({
  places: z.number().int().nonnegative(),
  leader: z.number().int().nonnegative(),
  follower: z.number().int().nonnegative(),
})
export type CapacityWarning = z.infer<typeof capacityWarning>

export const sessionDetail = z.object({
  session,
  /** null while the session is within its capacity and role places. */
  capacityWarning: capacityWarning.nullable(),
  counts: z.object({
    booked: z.number().int().nonnegative(),
    waitlisted: z.number().int().nonnegative(),
    leaders: z.number().int().nonnegative(),
    followers: z.number().int().nonnegative(),
    takenSeats: z.array(z.string()),
  }),
  /** null when the signed-in person may not see who attends. */
  roster: z.array(rosterEntry).nullable(),
  /** The signed-in person as a participant; null when they are not a member here. */
  viewer: z.object({ booking: booking.nullable(), eligibility }).nullable(),
  /** The manager's sign-off of the attendance; null while there is none. */
  approval: attendanceApproval.nullable(),
  permissions: z.object({
    manage: z.boolean(),
    takeAttendance: z.boolean(),
    approveAttendance: z.boolean(),
  }),
})
export type SessionDetail = z.infer<typeof sessionDetail>

export const sessionsGet = defineOperation("sessions_get_v1", {
  request: z.object({ sessionId: id }),
  response: sessionDetail,
})

/** Returns every session that changed. */
const changedSessions = z.object({ items: z.array(session) })

export const sessionsUpdate = defineOperation("sessions_update_v1", {
  request: z.object({
    sessionId: id,
    scope: editScope,
    changes: sessionChanges,
  }),
  response: changedSessions,
})

export const sessionsCancel = defineOperation("sessions_cancel_v1", {
  request: z.object({
    sessionId: id,
    scope: editScope,
    reason: z.string().trim().min(1),
  }),
  response: changedSessions,
})

const bookingChoice = {
  sessionId: id,
  personId: id,
  /** Omit to use the eligible package that expires first. */
  packageId: id.optional(),
  role: danceRole.optional(),
  seat: z.string().optional(),
}

export const bookingsCreate = defineOperation("bookings_create_v1", {
  request: z.object({
    ...bookingChoice,
    /** Join the waiting list of a full session instead of taking a place. */
    waitlist: z.boolean().default(false),
  }),
  response: booking,
})

/** What joining a course would do, so full sessions can be listed first. */
export const seriesPreview = defineOperation("bookings_series_preview_v1", {
  request: z.object(bookingChoice),
  response: z.object({ eligibility, fullSessions: z.array(session) }),
})

/** "Kura katıl": books every upcoming session of the series with priority. */
export const seriesJoin = defineOperation("bookings_series_join_v1", {
  request: z.object({
    ...bookingChoice,
    /** Center manager only: enroll although some sessions are full (ADR-021). */
    confirmFull: z.boolean().default(false),
  }),
  response: z.object({ items: z.array(booking) }),
})

export const bookingsCancel = defineOperation("bookings_cancel_v1", {
  request: z.object({ bookingId: id }),
  response: booking,
})

export const attendanceSet = defineOperation("attendance_set_v1", {
  request: z.object({
    bookingId: id,
    /** `booked` takes a mark back. */
    status: z.enum(["attended", "no_show", "booked"]),
    /** Required once the session ended: an exception on record (ADR-021). */
    reason: z.string().trim().min(1).optional(),
  }),
  response: booking,
})

/** The center manager signs off an ended session's attendance as it stands. */
export const attendanceApprove = defineOperation("attendance_approve_v1", {
  request: z.object({ sessionId: id }),
  response: attendanceApproval,
})
