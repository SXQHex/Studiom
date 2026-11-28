import { Collection } from "@msw/data"
import {
  debt,
  packageTemplate,
  payment,
  soldPackage,
} from "@workspace/contracts/commerce"
import {
  center,
  discipline,
  organization,
  room,
} from "@workspace/contracts/organization"
import { auditEvent } from "@workspace/contracts/audit"
import { exceptionEvent } from "@workspace/contracts/exception"
import { binding, lead, person } from "@workspace/contracts/person"
import { plan } from "@workspace/contracts/plan"
import { booking, session } from "@workspace/contracts/schedule"
import type { z } from "zod"

import type { Dataset } from "./seed/generate"

/** One `@msw/data` collection per contract schema; records are validated on the way in. */
function collection<Schema extends z.ZodType>(schema: Schema) {
  return new Collection({ schema })
}

async function fill<Schema extends z.ZodType>(
  target: Collection<Schema>,
  records: readonly z.input<Schema>[]
) {
  await Promise.all(records.map((record) => target.create(record)))
}

/**
 * The typed in-memory store (ADR-007), filled from a dataset. It lives in memory only:
 * changes last for the page's lifetime and a reload starts from the seed again.
 */
export async function createDb(dataset: Dataset) {
  const db = {
    plans: collection(plan),
    organizations: collection(organization),
    centers: collection(center),
    rooms: collection(room),
    disciplines: collection(discipline),
    people: collection(person),
    bindings: collection(binding),
    leads: collection(lead),
    packageTemplates: collection(packageTemplate),
    packages: collection(soldPackage),
    payments: collection(payment),
    debts: collection(debt),
    sessions: collection(session),
    bookings: collection(booking),
    exceptions: collection(exceptionEvent),
    audit: collection(auditEvent),
  }
  await Promise.all([
    fill(db.plans, dataset.plans),
    fill(db.organizations, dataset.organizations),
    fill(db.centers, dataset.centers),
    fill(db.rooms, dataset.rooms),
    fill(db.disciplines, dataset.disciplines),
    fill(db.people, dataset.people),
    fill(db.bindings, dataset.bindings),
    fill(db.leads, dataset.leads),
    fill(db.packageTemplates, dataset.packageTemplates),
    fill(db.packages, dataset.packages),
    fill(db.payments, dataset.payments),
    fill(db.debts, dataset.debts),
    fill(db.sessions, dataset.sessions),
    fill(db.bookings, dataset.bookings),
    fill(db.exceptions, dataset.exceptions),
    fill(db.audit, dataset.audit),
  ])
  return db
}

export type MockDb = Awaited<ReturnType<typeof createDb>>
