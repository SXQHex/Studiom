import { z } from "zod"

import { defineOperation, listResponse } from "./operation"
import { calendarDate, id, money, utcDateTime } from "./primitives"

export const credits = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("limited"), count: z.number().int().positive() }),
  z.object({ kind: z.literal("unlimited") }),
])

/** Organization-defined package template (ADR-004). Changes apply to new sales only. */
export const packageTemplate = z.object({
  id,
  organizationId: id,
  version: z.number().int().positive(),
  name: z.string().min(1),
  kind: z.enum(["standard", "course", "trial"]),
  disciplineIds: z.array(id).min(1),
  credits,
  validityDays: z.number().int().positive(),
  /** 0 means freezing is not offered. */
  freezeDays: z.number().int().nonnegative(),
  /** Free cancellation up to this many hours before the session. */
  cancelHours: z.number().int().nonnegative(),
  centerIds: z.array(id).min(1),
  suggestedPrice: money,
  makeup: z.discriminatedUnion("allowed", [
    z.object({ allowed: z.literal(false) }),
    z.object({ allowed: z.literal(true), max: z.number().int().positive() }),
  ]),
  status: z.enum(["active", "archived"]),
})
export type PackageTemplate = z.infer<typeof packageTemplate>

/** A sold right: a template version bought by one person at one center. */
export const soldPackage = z.object({
  id,
  organizationId: id,
  centerId: id,
  personId: id,
  templateId: id,
  templateVersion: z.number().int().positive(),
  soldAt: utcDateTime,
  startsOn: calendarDate,
  expiresOn: calendarDate,
  /** null for an unlimited package. */
  creditsTotal: z.number().int().positive().nullable(),
  creditsUsed: z.number().int().nonnegative(),
  makeupsUsed: z.number().int().nonnegative(),
  price: money,
  status: z.enum(["active", "frozen", "expired", "used_up"]),
})
export type SoldPackage = z.infer<typeof soldPackage>

export const payment = z.object({
  id,
  organizationId: id,
  centerId: id,
  personId: id,
  packageId: id,
  kind: z.enum(["payment", "refund"]),
  method: z.enum(["cash", "card", "transfer"]),
  amount: money,
  paidAt: utcDateTime,
  /** Required for a refund (exception class, ADR-003). */
  reason: z.string().nullable(),
})
export type Payment = z.infer<typeof payment>

/** The unpaid part of a package price. */
export const debt = z.object({
  id,
  organizationId: id,
  centerId: id,
  personId: id,
  packageId: id,
  amount: money,
  dueOn: calendarDate,
  status: z.enum(["open", "closed"]),
})
export type Debt = z.infer<typeof debt>

export const packageTemplatesList = defineOperation(
  "package_templates_list_v1",
  {
    request: z.object({ organizationId: id }),
    response: listResponse(packageTemplate),
  }
)

const commerceFilter = z.object({
  organizationId: id.optional(),
  centerId: id.optional(),
  personId: id.optional(),
})

export const packagesList = defineOperation("packages_list_v1", {
  request: commerceFilter,
  response: listResponse(soldPackage),
})

export const paymentsList = defineOperation("payments_list_v1", {
  request: commerceFilter,
  response: listResponse(payment),
})

export const debtsList = defineOperation("debts_list_v1", {
  request: commerceFilter,
  response: listResponse(debt),
})
