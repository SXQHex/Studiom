import { z } from "zod"

import { debt, payment, soldPackage } from "./commerce"
import { defineOperation } from "./operation"
import { binding, person } from "./person"
import { id } from "./primitives"
import { booking, session } from "./schedule"

/**
 * One person inside one organization. A center sees only its own records, and money
 * is null for people who may not see it (ADR-003).
 */
export const personProfile = z.object({
  person,
  bindings: z.array(binding),
  packages: z.array(soldPackage),
  bookings: z.array(z.object({ booking, session })),
  finance: z
    .object({ payments: z.array(payment), debts: z.array(debt) })
    .nullable(),
  /** True when the viewer may only look (organization oversight). */
  readOnly: z.boolean(),
})
export type PersonProfile = z.infer<typeof personProfile>

export const peopleProfile = defineOperation("people_profile_v1", {
  request: z.object({ organizationId: id, personId: id }),
  response: personProfile,
})

const invitation = z.object({ person, binding })

/** Invites a member to a center; accounts only start from an invitation (ADR-004). */
export const peopleInvite = defineOperation("people_invite_v1", {
  request: z.object({
    centerId: id,
    firstName: z.string().trim().min(1),
    lastName: z.string().trim().min(1),
    email: z.email(),
  }),
  response: invitation,
})

export const peopleInviteResend = defineOperation("people_invite_resend_v1", {
  request: z.object({ organizationId: id, personId: id }),
  response: invitation,
})
