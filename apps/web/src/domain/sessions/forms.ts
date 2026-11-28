import { calendarDate, localTime } from "@workspace/contracts/primitives"
import {
  editScope,
  roleCapacity,
  sessionChanges,
} from "@workspace/contracts/schedule"
import { z } from "zod"

/** The fields of the session edit form, as the inputs hold them. */
export const sessionEditForm = z.object({
  scope: editScope,
  date: calendarDate,
  startTime: localTime,
  durationMinutes: z.number().int().min(15).max(480),
  roomId: z.string().min(1),
  instructorId: z.string().min(1),
  capacity: z.number().int().positive(),
  /** Only for sessions with role balance. */
  roleCapacity: roleCapacity.optional(),
})
export type SessionEditForm = z.infer<typeof sessionEditForm>

/** Only what the person changed, or null when nothing did. */
export function sessionEditChanges(
  initial: SessionEditForm,
  current: SessionEditForm
) {
  const changed = Object.fromEntries(
    Object.entries(current).filter(
      ([key, value]) =>
        key !== "scope" &&
        JSON.stringify(value) !== JSON.stringify(Reflect.get(initial, key))
    )
  )
  const result = sessionChanges.safeParse(changed)
  return result.success ? result.data : null
}

/** Cancelling a session always needs a reason. */
export const sessionCancelForm = z.object({
  scope: editScope,
  reason: z.string().trim().min(1),
})
