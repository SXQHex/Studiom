import { apiError, type Operation } from "@workspace/contracts/operation"
import type { z } from "zod"

/** A failed operation, carrying the contract's error code. */
export class ApiRequestError extends Error {
  readonly status: number
  readonly code: z.infer<typeof apiError>["code"]

  /** The business rule behind a `conflict`. */
  readonly reason: z.infer<typeof apiError>["reason"]

  constructor(
    status: number,
    code: z.infer<typeof apiError>["code"],
    reason?: z.infer<typeof apiError>["reason"]
  ) {
    super(`API ${status}: ${reason ?? code}`)
    this.name = "ApiRequestError"
    this.status = status
    this.code = code
    this.reason = reason
  }
}

// Same-origin in the browser; unit tests in Node have no location.
const origin =
  typeof location === "undefined" ? "http://localhost" : location.origin

/**
 * Calls one contract operation and parses the response with its schema. The mock
 * worker answers today; a backend implementing the same contract later (ADR-007).
 */
export async function callOperation<
  Request extends z.ZodType,
  Response extends z.ZodType,
>(
  op: Operation<Request, Response>,
  input: z.input<Request>
): Promise<z.output<Response>> {
  const response = await fetch(new URL(op.path, origin).href, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(op.request.parse(input)),
  })
  // A failed response may carry no JSON at all; it still becomes an ApiRequestError.
  const body: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const error = apiError.safeParse(body)
    throw new ApiRequestError(
      response.status,
      error.success ? error.data.code : "internal",
      error.success ? error.data.reason : undefined
    )
  }
  return op.response.parse(body)
}
