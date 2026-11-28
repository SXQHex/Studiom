import { z } from "zod"

import { defineOperation, listResponse } from "./operation"
import { enrollment, sessionLevel } from "./organization"
import { id, utcDateTime } from "./primitives"

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
    roleBalance: z.boolean(),
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
  "attended",
  "no_show",
])
export type BookingStatus = z.infer<typeof bookingStatus>

export const booking = z.object({
  id,
  sessionId: id,
  personId: id,
  /** The sold package the booking draws from; null for a trial seat. */
  packageId: id.nullable(),
  status: bookingStatus,
  role: z.enum(["leader", "follower"]).nullable(),
  seat: z.string().nullable(),
  /** A makeup fills capacity but does not count toward role balance (ADR-004). */
  isMakeup: z.boolean(),
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
