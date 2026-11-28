import { z } from "zod"

import { id, utcDateTime } from "./primitives"

/** One audit record: the person and the binding they acted with (ADR-001). */
export const auditEvent = z.object({
  id,
  organizationId: id,
  centerId: id,
  kind: z.enum([
    "attendance_approved",
    "attendance_changed",
    /** A course enrollment written into full sessions. */
    "capacity_override",
    /** A manager's reasoned booking into a closed session. */
    "booking_override",
  ]),
  actorPersonId: id,
  actorBindingId: id,
  sessionId: id,
  /** Whose record changed; null for an action on the whole session. */
  subjectPersonId: id.nullable(),
  /** The written reason of a change; an approval needs none. */
  reason: z.string().min(1).nullable(),
  createdAt: utcDateTime,
})
export type AuditEvent = z.infer<typeof auditEvent>
