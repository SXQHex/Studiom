import { z } from "zod"

import {
  defineOperation,
  listResponse,
  noInput,
  pageRequest,
} from "./operation"
import { calendarDate, id, locale, utcDateTime } from "./primitives"

/** One person = one account (ADR-001). Accounts are only created by invitation (ADR-004). */
export const person = z.object({
  id,
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email(),
  phone: z.string().nullable(),
  locale,
  accountStatus: z.enum(["active", "invited", "none"]),
  createdAt: utcDateTime,
})
export type Person = z.infer<typeof person>

/** Whole modules a manager can open for a staff member (ADR-003). */
export const staffModule = z.enum(["program", "people", "sales", "center"])
export type StaffModule = z.infer<typeof staffModule>

const bindingBase = {
  id,
  personId: id,
  status: z.enum(["active", "invited"]),
  createdAt: utcDateTime,
}

/** A binding is a scope plus a role (ADR-001). */
export const binding = z.discriminatedUnion("scope", [
  z.object({
    ...bindingBase,
    scope: z.literal("platform"),
    role: z.enum(["platform_owner", "platform_manager"]),
  }),
  z.object({
    ...bindingBase,
    scope: z.literal("organization"),
    organizationId: id,
    role: z.enum(["owner", "org_manager"]),
  }),
  z.object({
    ...bindingBase,
    scope: z.literal("center"),
    organizationId: id,
    centerId: id,
    role: z.enum(["center_manager", "staff"]),
    /** Modules opened for staff; a center manager has every module. */
    modules: z.array(staffModule),
  }),
  z.object({
    ...bindingBase,
    scope: z.literal("instructor"),
    organizationId: id,
    centerId: id,
    role: z.enum(["instructor", "assistant"]),
  }),
  z.object({
    ...bindingBase,
    scope: z.literal("member"),
    /** A member is the customer of the organization, not of a center (ADR-003). */
    organizationId: id,
    homeCenterId: id,
  }),
])
export type Binding = z.infer<typeof binding>
export type BindingScope = Binding["scope"]

/** A prospect from the public page or entered by hand (ADR-004). */
export const lead = z.object({
  id,
  organizationId: id,
  centerId: id,
  personId: id,
  source: z.enum(["public_form", "manual"]),
  interest: z.enum(["trial", "info"]),
  status: z.enum(["new", "trial_offered", "converted", "lost"]),
  note: z.string().nullable(),
  followUpOn: calendarDate.nullable(),
  createdAt: utcDateTime,
})
export type Lead = z.infer<typeof lead>

/** The signed-in person and every binding they hold. */
export const currentSession = z.object({
  person,
  bindings: z.array(binding),
})
export type CurrentSession = z.infer<typeof currentSession>

export const sessionCurrent = defineOperation("auth_session_current_v1", {
  request: noInput,
  response: currentSession.nullable(),
})

/** Mock mode only: the "Örnek kullanıcılar" quick sign-in list (ADR-007). */
export const sampleUsersList = defineOperation("auth_sample_users_v1", {
  request: noInput,
  response: z.object({
    items: z.array(
      z.object({
        personId: id,
        label: z.string().min(1),
        name: z.string().min(1),
      })
    ),
  }),
})

export const signInAs = defineOperation("auth_sign_in_as_v1", {
  request: z.object({ personId: id }),
  response: currentSession,
})

export const peopleList = defineOperation("people_list_v1", {
  request: z.object({
    organizationId: id,
    centerId: id.optional(),
    scope: z
      .enum(["member", "instructor", "center", "organization"])
      .optional(),
    query: z.string().optional(),
    accountStatus: z.enum(["active", "invited", "none"]).optional(),
    ...pageRequest.shape,
  }),
  response: listResponse(person),
})

export const leadsList = defineOperation("leads_list_v1", {
  request: z.object({ organizationId: id, centerId: id.optional() }),
  response: listResponse(lead),
})
