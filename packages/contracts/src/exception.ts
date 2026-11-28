import { z } from "zod"

import { id, utcDateTime } from "./primitives"

/** An action that needs a reason and shows up in the organization's exceptions (ADR-003). */
export const exceptionEvent = z.object({
  id,
  organizationId: id,
  centerId: id,
  kind: z.enum(["retroactive_attendance"]),
  actorPersonId: id,
  subjectPersonId: id,
  reason: z.string().min(1),
  createdAt: utcDateTime,
})
export type ExceptionEvent = z.infer<typeof exceptionEvent>
