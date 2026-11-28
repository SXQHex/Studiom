import {
  debtsList,
  packagesList,
  packageTemplatesList,
  paymentsList,
} from "@workspace/contracts/commerce"
import { apiBasePath, type Operation } from "@workspace/contracts/operation"
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
import { delay, http, type RequestHandler } from "msw"
import { z } from "zod"

import { bookingHandlers } from "./handlers/bookings"
import { createLookups } from "./handlers/lookups"
import { peopleHandlers } from "./handlers/people"
import {
  createIds,
  createWriteQueue,
  handle,
  problem,
  respond,
  type MockContext,
} from "./handlers/respond"
import { sessionHandlers } from "./handlers/sessions"
import { slowDelayMs } from "./scenario"
import { people as namedPeople, sampleUsers } from "./seed/catalog"
import { isActive } from "./rules/booking"
import { organizationUsage } from "./usage"

/** The shell needs these to draw itself, so scenarios never touch them. */
const scenarioExempt = new Set(
  [sessionCurrent, sampleUsersList, signInAs, capabilitiesGet].map(
    (op) => op.name
  )
)

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
  const lookups = createLookups(db)
  const write = createWriteQueue()
  const ids = createIds()

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

    list(peopleList, (input) => {
      const { organizationId, centerId, scope, query, accountStatus } = input
      const matching = new Set(
        bindingsOf(organizationId)
          .filter((b) => scope === undefined || b.scope === scope)
          .filter((b) => centerId === undefined || touchesCenter(b, centerId))
          .map((b) => b.personId)
      )
      const needle = query?.trim().toLocaleLowerCase("tr") ?? ""
      return db.people
        .findMany((q) => q.where({ id: (id) => matching.has(id) }), {
          orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
        })
        .filter(
          (p) =>
            accountStatus === undefined || p.accountStatus === accountStatus
        )
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
                .filter(isActive)
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

    ...sessionHandlers(context, lookups, write, ids),
    ...bookingHandlers(context, lookups, write, ids),
    ...peopleHandlers(context, lookups, write, ids),
  ]
}
