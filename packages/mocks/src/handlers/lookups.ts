import type { Binding } from "@workspace/contracts/person"
import type { Session } from "@workspace/contracts/schedule"

import type { PackageWithTemplate } from "../rules/booking"
import type { MockDb } from "../store"

/** Reads several handlers share. */
export function createLookups(db: MockDb) {
  const centerOf = (centerId: string) =>
    db.centers.findFirst((q) => q.where({ id: centerId }))

  const bindingsOfPerson = (personId: string): Binding[] =>
    db.bindings.findMany((q) => q.where({ personId, status: "active" }))

  const sessionById = (sessionId: string) =>
    db.sessions.findFirst((q) => q.where({ id: sessionId }))

  const bookingsOfSession = (sessionId: string) =>
    db.bookings.findMany((q) => q.where({ sessionId }))

  const seriesOf = (session: Session) =>
    session.seriesId === null
      ? [session]
      : db.sessions.findMany((q) => q.where({ seriesId: session.seriesId }))

  const packagesOf = (
    personId: string,
    organizationId: string
  ): PackageWithTemplate[] =>
    db.packages
      .findMany((q) => q.where({ personId, organizationId }))
      .flatMap((pkg) => {
        const template = db.packageTemplates.findFirst((q) =>
          // Template changes apply to new sales only, so read the version sold.
          q.where({ id: pkg.templateId, version: pkg.templateVersion })
        )
        return template ? [{ package: pkg, template }] : []
      })

  /** The standing approval of a session's attendance, if there is one. */
  const approvalOf = (sessionId: string) => {
    const event = db.audit.findFirst((q) =>
      q.where({ sessionId, kind: "attendance_approved" })
    )
    return event
      ? { byPersonId: event.actorPersonId, at: event.createdAt }
      : null
  }

  const planOf = (organizationId: string) => {
    const org = db.organizations.findFirst((q) =>
      q.where({ id: organizationId })
    )
    if (!org) return undefined
    return db.plans.findFirst((q) =>
      q.where({ id: org.planId, version: org.planVersion })
    )
  }

  return {
    centerOf,
    bindingsOfPerson,
    sessionById,
    bookingsOfSession,
    seriesOf,
    packagesOf,
    approvalOf,
    planOf,
  }
}
export type Lookups = ReturnType<typeof createLookups>
