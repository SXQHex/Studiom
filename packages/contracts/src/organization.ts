import { z } from "zod"

import { defineOperation, listResponse, noInput } from "./operation"
import { planId } from "./plan"
import { currency, id, timeZone, utcDateTime } from "./primitives"

export const organization = z.object({
  id,
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  planId,
  planVersion: z.number().int().positive(),
  status: z.enum(["active", "trial", "suspended"]),
  trialEndsAt: utcDateTime.nullable(),
  ownerPersonId: id,
  setupCompleted: z.boolean(),
  createdAt: utcDateTime,
})
export type Organization = z.infer<typeof organization>

export const center = z.object({
  id,
  organizationId: id,
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  city: z.string().min(1),
  timeZone,
  currency,
  status: z.enum(["active", "archived"]),
})
export type Center = z.infer<typeof center>

/** Equipment enables seat selection, for example reformer stations. */
export const equipment = z.object({
  kind: z.enum(["reformer"]),
  units: z.number().int().positive(),
})

export const room = z.object({
  id,
  centerId: id,
  name: z.string().min(1),
  capacity: z.number().int().positive(),
  equipment: equipment.nullable(),
  status: z.enum(["active", "archived"]),
})
export type Room = z.infer<typeof room>

export const sessionLevel = z.enum([
  "all",
  "beginner",
  "intermediate",
  "advanced",
])
export type SessionLevel = z.infer<typeof sessionLevel>

/** How people enroll: one session at a time, or the whole series ("Kura katıl"). */
export const enrollment = z.enum(["session", "series"])

/** A discipline suggests the default session options (ADR-004). */
export const discipline = z.object({
  id,
  organizationId: id,
  name: z.string().min(1),
  kind: z.enum(["dance", "yoga", "pilates"]),
  defaults: z.object({
    enrollment,
    roleBalance: z.boolean(),
    seatSelection: z.boolean(),
  }),
  status: z.enum(["active", "archived"]),
})
export type Discipline = z.infer<typeof discipline>

export const organizationsList = defineOperation("organizations_list_v1", {
  request: noInput,
  response: listResponse(organization),
})

export const centersList = defineOperation("centers_list_v1", {
  request: z.object({ organizationId: id }),
  response: listResponse(center),
})

export const roomsList = defineOperation("rooms_list_v1", {
  request: z.object({ centerId: id }),
  response: listResponse(room),
})

export const disciplinesList = defineOperation("disciplines_list_v1", {
  request: z.object({ organizationId: id }),
  response: listResponse(discipline),
})
