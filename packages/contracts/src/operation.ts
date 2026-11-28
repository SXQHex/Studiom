import { z } from "zod"

import { ruleReason } from "./rules"

/** Operations follow the Edge Function style: POST /functions/v1/api/<operation> (ADR-018). */
export const apiBasePath = "/functions/v1/api"

/** One API operation: its path and the schemas of its request and response bodies. */
export interface Operation<
  Request extends z.ZodType = z.ZodType,
  Response extends z.ZodType = z.ZodType,
> {
  readonly name: string
  readonly path: string
  readonly request: Request
  readonly response: Response
}

export function defineOperation<
  Request extends z.ZodType,
  Response extends z.ZodType,
>(
  name: string,
  schemas: { request: Request; response: Response }
): Operation<Request, Response> {
  return { name, path: `${apiBasePath}/${name}`, ...schemas }
}

/** Request body of an operation that takes no input. */
export const noInput = z.object({}).strict()

/** Error body of every failed operation; the HTTP status carries the same meaning. */
export const apiError = z.object({
  code: z.enum(["forbidden", "not_found", "invalid", "conflict", "internal"]),
  /** Which business rule refused a `conflict`, for the screen to explain it. */
  reason: ruleReason.optional(),
  message: z.string().optional(),
})
export type ApiError = z.infer<typeof apiError>

/** Offset paging shared by list operations. */
export const pageRequest = z.object({
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(25),
})

/** Response of a list operation: one page of items and the total count. */
export function listResponse<Item extends z.ZodType>(item: Item) {
  return z.object({
    items: z.array(item),
    total: z.number().int().nonnegative(),
  })
}
