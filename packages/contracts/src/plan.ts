import { z } from "zod"

import { defineOperation, noInput } from "./operation"
import { id, money } from "./primitives"

/** Feature names: the only plan facts fixed in code (ADR-010). */
export const planFeatures = [
  "waitlist",
  "freeze",
  "payroll",
  "events",
  "advancedCrm",
  "automation",
  "emailNotifications",
  "reminders",
  "advancedReports",
  "consolidatedReports",
  "settlement",
  "staffPermissions",
] as const
export const planFeature = z.enum(planFeatures)
export type PlanFeature = z.infer<typeof planFeature>

/** Limit keys (ADR-010). */
export const limitKeys = [
  "centers",
  "rooms",
  "disciplines",
  "instructors",
  "activeStudents",
] as const
export const limitKey = z.enum(limitKeys)
export type LimitKey = z.infer<typeof limitKey>

/** "No commercial quota" is an explicit value, never 0 or a magic large number (ADR-010). */
export const limit = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("limited"), max: z.number().int().nonnegative() }),
  z.object({ kind: z.literal("unlimited") }),
])
export type Limit = z.infer<typeof limit>

export const planId = z.enum(["starter", "pro", "business"])
export type PlanId = z.infer<typeof planId>

/** One version of a plan. Changes create a new version that applies to new subscriptions and renewals. */
export const plan = z.object({
  id: planId,
  version: z.number().int().positive(),
  name: z.string().min(1),
  limits: z.record(limitKey, limit),
  features: z.array(planFeature),
  priceMonthly: money,
  priceYearly: money,
})
export type Plan = z.infer<typeof plan>

/** Plan of one organization plus its current usage of every limit key. */
export const capabilities = z.object({
  organizationId: id,
  plan,
  usage: z.record(limitKey, z.number().int().nonnegative()),
})
export type Capabilities = z.infer<typeof capabilities>

export const plansList = defineOperation("plans_list_v1", {
  request: noInput,
  response: z.object({ items: z.array(plan) }),
})

export const capabilitiesGet = defineOperation("capabilities_get_v1", {
  request: z.object({ organizationId: id }),
  response: capabilities,
})
