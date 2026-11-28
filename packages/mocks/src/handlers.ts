import {
  debtsList,
  packagesList,
  packageTemplatesList,
  paymentsList,
} from "@workspace/contracts/commerce"
import {
  apiBasePath,
  type ApiError,
  type Operation,
} from "@workspace/contracts/operation"
import {
  centersList,
  disciplinesList,
  organizationsList,
  roomsList,
} from "@workspace/contracts/organization"
import {
  leadsList,
  peopleList,
  sampleUsersList,
  sessionCurrent,
  signInAs,
  type Binding,
} from "@workspace/contracts/person"
import { capabilitiesGet, plansList } from "@workspace/contracts/plan"
import { bookingsList, sessionsList } from "@workspace/contracts/schedule"
import { systemHealth } from "@workspace/contracts/system"
import { delay, http, HttpResponse, type RequestHandler } from "msw"
import { z } from "zod"

import { type Scenario, slowDelayMs } from "./scenario"
import { people as namedPeople, sampleUsers } from "./seed/catalog"
import type { MockDb } from "./store"
import { organizationUsage } from "./usage"

export interface MockContext {
  db: MockDb
  /** The scenario of the page that sent the request. */
  scenario: () => Scenario | null
  /** The signed-in person; the browser keeps it for the tab's lifetime. */
  auth: { get(): string | null; set(personId: string | null): void }
}

/** The shell needs these to draw itself, so scenarios never touch them. */
const scenarioExempt = new Set(
  [sessionCurrent, sampleUsersList, signInAs, capabilitiesGet].map(
    (op) => op.name
  )
)

const statusOf: Record<ApiError["code"], number> = {
  invalid: 400,
  forbidden: 403,
  not_found: 404,
  internal: 500,
}

function problem(code: ApiError["code"], message?: string) {
  const body: ApiError = message === undefined ? { code } : { code, message }
  return HttpResponse.json(body, { status: statusOf[code] })
}

/** Answers one operation: validates the request and the response against the contract. */
function respond<Request extends z.ZodType>(
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
    const result = resolve(input.data)
    if (result instanceof Response) return result
    return new HttpResponse(JSON.stringify(op.response.parse(result)), {
      headers: { "Content-Type": "application/json" },
    })
  })
}

/** `respond` with the resolver's result checked against the response type at compile time. */
function handle<Request extends z.ZodType, Result extends z.ZodType>(
  op: Operation<Request, Result>,
  resolve: (input: z.output<Request>) => z.input<Result> | Response
) {
  return respond(op, resolve)
}

const paging = z.object({ page: z.number(), pageSize: z.number() })

interface CommerceRecord {
  organizationId: string
  centerId: string
  personId: string
}

/** Omitted filter fields match everything. */
function matchesFilter(
  record: CommerceRecord,
  filter: Partial<Record<keyof CommerceRecord, string | undefined>>
) {
  return (
    (filter.organizationId === undefined ||
      record.organizationId === filter.organizationId) &&
    (filter.centerId === undefined || record.centerId === filter.centerId) &&
    (filter.personId === undefined || record.personId === filter.personId)
  )
}

function touchesCenter(b: Binding, centerId: string) {
  return (
    (b.scope === "member" && b.homeCenterId === centerId) ||
    ((b.scope === "center" || b.scope === "instructor") &&
      b.centerId === centerId)
  )
}

export function createHandlers(context: MockContext): RequestHandler[] {
  const { db, scenario, auth } = context

  /** A list operation: the `empty` scenario empties it; paged inputs are paged. */
  function list<Request extends z.ZodType>(
    op: Operation<Request>,
    items: (input: z.output<Request>) => readonly unknown[]
  ) {
    return respond(op, (input) => {
      const all = scenario() === "empty" ? [] : items(input)
      const page = paging.safeParse(input)
      const slice = page.success
        ? all.slice(
            (page.data.page - 1) * page.data.pageSize,
            page.data.page * page.data.pageSize
          )
        : all
      return { items: slice, total: all.length }
    })
  }

  const currentSession = () => {
    const personId = auth.get()
    if (personId === null) return null
    const person = db.people.findFirst((q) => q.where({ id: personId }))
    if (!person) return null
    return {
      person,
      bindings: db.bindings.findMany((q) =>
        q.where({ personId, status: "active" })
      ),
    }
  }

  const bindingsOf = (organizationId: string) =>
    db.bindings.findMany((q) => q.where({ organizationId }))

  return [
    // Scenario switch (ADR-007): runs first and falls through when there is nothing to do.
    http.all(`*${apiBasePath}/*`, async ({ request }) => {
      const name = new URL(request.url).pathname.split("/").at(-1) ?? ""
      if (scenarioExempt.has(name)) return undefined
      switch (scenario()) {
        case "slow":
          await delay(slowDelayMs)
          return undefined
        case "error":
          return problem("internal")
        case "forbidden":
          return problem("forbidden")
        default:
          return undefined
      }
    }),

    handle(systemHealth, () => ({ status: "ok" as const })),

    handle(sessionCurrent, () => currentSession()),
    handle(sampleUsersList, () => ({
      items: sampleUsers.map(({ person, label }) => {
        const named = namedPeople[person]
        return {
          personId: named.id,
          label,
          name: `${named.firstName} ${named.lastName}`,
        }
      }),
    })),
    handle(signInAs, ({ personId }) => {
      const exists = db.people.findFirst((q) =>
        q.where({ id: personId, accountStatus: "active" })
      )
      if (!exists) return problem("not_found")
      auth.set(personId)
      return currentSession() ?? problem("internal")
    }),

    list(plansList, () => db.plans.all()),
    handle(capabilitiesGet, ({ organizationId }) => {
      const org = db.organizations.findFirst((q) =>
        q.where({ id: organizationId })
      )
      if (!org) return problem("not_found")
      const plan = db.plans.findFirst((q) =>
        q.where({ id: org.planId, version: org.planVersion })
      )
      if (!plan) return problem("internal", "Plan version missing")
      return {
        organizationId,
        plan,
        usage: organizationUsage(db, organizationId),
      }
    }),

    list(organizationsList, () =>
      db.organizations.findMany(undefined, { orderBy: { name: "asc" } })
    ),
    list(centersList, ({ organizationId }) =>
      db.centers.findMany((q) => q.where({ organizationId }))
    ),
    list(roomsList, ({ centerId }) =>
      db.rooms.findMany((q) => q.where({ centerId }))
    ),
    list(disciplinesList, ({ organizationId }) =>
      db.disciplines.findMany((q) => q.where({ organizationId }))
    ),

    list(peopleList, ({ organizationId, centerId, scope, query }) => {
      const ids = new Set(
        bindingsOf(organizationId)
          .filter((b) => scope === undefined || b.scope === scope)
          .filter((b) => centerId === undefined || touchesCenter(b, centerId))
          .map((b) => b.personId)
      )
      const needle = query?.trim().toLocaleLowerCase("tr") ?? ""
      return db.people
        .findMany((q) => q.where({ id: (id) => ids.has(id) }), {
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        })
        .filter((p) =>
          `${p.firstName} ${p.lastName} ${p.email}`
            .toLocaleLowerCase("tr")
            .includes(needle)
        )
    }),
    list(leadsList, ({ organizationId, centerId }) =>
      db.leads.findMany((q) =>
        q.where(
          centerId === undefined
            ? { organizationId }
            : { organizationId, centerId }
        )
      )
    ),

    list(sessionsList, ({ centerId, instructorId, personId, from, to }) => {
      const booked =
        personId === undefined
          ? null
          : new Set(
              db.bookings
                .findMany((q) => q.where({ personId }))
                .filter((b) => b.status !== "cancelled")
                .map((b) => b.sessionId)
            )
      // Compared as instants: bounds may be written with another precision (`…:00Z`).
      const fromTime = Date.parse(from)
      const toTime = Date.parse(to)
      return db.sessions
        .findMany(
          (q) =>
            q.where({
              startsAt: (startsAt) => {
                const time = Date.parse(startsAt)
                return time >= fromTime && time < toTime
              },
            }),
          { orderBy: { startsAt: "asc" } }
        )
        .filter((s) => centerId === undefined || s.centerId === centerId)
        .filter(
          (s) =>
            instructorId === undefined ||
            s.instructorId === instructorId ||
            s.assistantIds.includes(instructorId)
        )
        .filter(
          (s) =>
            booked === null ||
            booked.has(s.id) ||
            s.instructorId === personId ||
            s.assistantIds.includes(personId ?? "")
        )
    }),
    list(bookingsList, ({ sessionId, personId }) =>
      db.bookings.findMany((q) =>
        q.where({
          ...(sessionId === undefined ? {} : { sessionId }),
          ...(personId === undefined ? {} : { personId }),
        })
      )
    ),

    list(packageTemplatesList, ({ organizationId }) =>
      db.packageTemplates.findMany((q) => q.where({ organizationId }))
    ),
    list(packagesList, (filter) =>
      db.packages.findMany((q) => q.where((r) => matchesFilter(r, filter)))
    ),
    list(paymentsList, (filter) =>
      db.payments.findMany((q) => q.where((r) => matchesFilter(r, filter)))
    ),
    list(debtsList, (filter) =>
      db.debts.findMany((q) => q.where((r) => matchesFilter(r, filter)))
    ),
  ]
}
