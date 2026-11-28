import { z } from "zod"

/** Business rules that can refuse an operation. Screens translate these codes. */
export const ruleReason = z.enum([
  // Booking
  "session_cancelled",
  "session_started",
  "already_booked",
  "series_only",
  "not_a_series",
  "not_a_member",
  "no_package",
  "package_frozen",
  "not_enough_credits",
  "full",
  "not_full",
  "role_required",
  "role_full",
  "seat_required",
  "seat_taken",
  "invalid_seat",
  "plan_feature",
  "not_cancellable",
  // Attendance
  "attendance_not_open",
  "reason_required",
  // Session changes
  "in_past",
  "invalid_room",
  "invalid_instructor",
  "room_busy",
  "instructor_busy",
  "over_room_limit",
  "capacity_below_booked",
  // People
  "already_member",
  "plan_limit",
  "not_invited",
])
export type RuleReason = z.infer<typeof ruleReason>
