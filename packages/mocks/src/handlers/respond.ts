import type { ApiError, Operation } from "@workspace/contracts/operation"
import type { RuleReason } from "@workspace/contracts/rules"
import { http, HttpResponse } from "msw"
import { z } from "zod"

import type { Scenario } from "../scenario"
import type { MockDb } from "../store"

export interface MockContext {
  db: MockDb
  /** The scenario of the page that sent the request. */
  scenario: () => Scenario | null
  /** The signed-in person; the browser keeps it for the tab's lifetime. */
  auth: { get(): string | null; set(personId: string | null): void }
  /** The current instant; tests pin it. */
  now: () => Date
}

const statusOf: Record<ApiError["code"], number> = {
  invalid: 400,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  internal: 500,
}

export function problem(code: ApiError["code"], message?: string) {
  const body: ApiError = message === undefined ? { code } : { code, message }
  return HttpResponse.json(body, { status: statusOf[code] })
}

/** A business rule refused the operation. */
export function refuse(reason: RuleReason) {
  const body: ApiError = { code: "conflict", reason }
  return HttpResponse.json(body, { status: statusOf.conflict })
}

/** Answers one operation: validates the request and the response against the contract. */
export function respond<Request extends z.ZodType>(
  op: Operation<Request>,
  resolve: (input: z.output<Request>) => unknown
) {
  return http.post(`*${op.path}`, async ({ request }) => {
    const text = await request.text()
    let body: unknown = {}
    if (text) {
      try {
        body = JSON.parse(text)
      } catch {
        return problem("invalid", "Body is not JSON")
      }
    }
    const input = op.request.safeParse(body)
    if (!input.success) return problem("invalid", z.prettifyError(input.error))
    const result: unknown = await resolve(input.data)
    if (result instanceof Response) return result
    return new HttpResponse(JSON.stringify(op.response.parse(result)), {
      headers: { "Content-Type": "application/json" },
    })
  })
}

/** `respond` with the resolver's result checked against the response type at compile time. */
export function handle<Request extends z.ZodType, Result extends z.ZodType>(
  op: Operation<Request, Result>,
  resolve: (
    input: z.output<Request>
  ) => z.input<Result> | Response | Promise<z.input<Result> | Response>
) {
  return respond(op, resolve)
}

/**
 * Runs writes one after another, so a check and its write are never interleaved
 * (two requests cannot take the last place).
 */
export function createWriteQueue() {
  let tail: Promise<unknown> = Promise.resolve()
  return <Result>(write: () => Promise<Result>): Promise<Result> => {
    const result = tail.then(write)
    tail = result.catch(() => undefined)
    return result
  }
}
export type WriteQueue = ReturnType<typeof createWriteQueue>

/** Readable ids for records created during the session. */
export function createIds() {
  let count = 0
  return (prefix: string) => {
    count += 1
    return `${prefix}_new_${count}`
  }
}
export type Ids = ReturnType<typeof createIds>
