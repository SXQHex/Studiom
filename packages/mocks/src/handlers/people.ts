import type { Binding, Person } from "@workspace/contracts/person"
import {
  peopleInvite,
  peopleInviteResend,
  peopleProfile,
} from "@workspace/contracts/profile"

import { overseesOrganization, worksAtCenter } from "../rules/access"
import { organizationUsage } from "../usage"
import type { Lookups } from "./lookups"
import {
  handle,
  problem,
  refuse,
  type Ids,
  type MockContext,
  type WriteQueue,
} from "./respond"

export function peopleHandlers(
  context: MockContext,
  lookups: Lookups,
  write: WriteQueue,
  ids: Ids
) {
  const { db, auth, now } = context

  const centersOf = (organizationId: string) =>
    db.centers
      .findMany((q) => q.where({ organizationId }))
      .map((center) => center.id)

  /** Which centers' records of a person the viewer may see, and whether money too. */
  const profileAccess = (
    viewerId: string,
    organizationId: string,
    personId: string,
    memberCenters: ReadonlySet<string>
  ) => {
    const all = centersOf(organizationId)
    if (viewerId === personId) {
      return { centers: all, money: true, readOnly: false }
    }
    const bindings = lookups.bindingsOfPerson(viewerId)
    // A center sees a member who belongs to it, and only its own records.
    const own = all.filter(
      (centerId) =>
        memberCenters.has(centerId) &&
        worksAtCenter(bindings, centerId, ["program", "people", "sales"])
    )
    if (own.length > 0) {
      return {
        centers: own,
        money: own.some((id) => worksAtCenter(bindings, id, ["sales"])),
        readOnly: false,
      }
    }
    return overseesOrganization(bindings, organizationId)
      ? { centers: all, money: true, readOnly: true }
      : null
  }

  const invitationOf = (personId: string, organizationId: string) => {
    const person = db.people.findFirst((q) => q.where({ id: personId }))
    const binding = db.bindings
      .findMany((q) => q.where({ personId }))
      .find((b) => b.scope === "member" && b.organizationId === organizationId)
    return person && binding ? { person, binding } : null
  }

  const mayInvite = (centerId: string) => {
    const actorId = auth.get()
    return (
      actorId !== null &&
      worksAtCenter(lookups.bindingsOfPerson(actorId), centerId, ["people"])
    )
  }

  return [
    handle(peopleProfile, ({ organizationId, personId }) => {
      const viewerId = auth.get()
      if (viewerId === null) return problem("forbidden")
      const person = db.people.findFirst((q) => q.where({ id: personId }))
      const bindings = db.bindings
        .findMany((q) => q.where({ personId }))
        .filter(
          (b) => b.scope !== "platform" && b.organizationId === organizationId
        )
      if (!person || bindings.length === 0) return problem("not_found")
      const packages = db.packages.findMany((q) =>
        q.where({ organizationId, personId })
      )
      const memberCenters = new Set([
        ...packages.map((p) => p.centerId),
        ...bindings.flatMap((b) =>
          b.scope === "member" ? [b.homeCenterId] : []
        ),
      ])
      const access = profileAccess(
        viewerId,
        organizationId,
        personId,
        memberCenters
      )
      if (!access) return problem("forbidden")
      const visible = new Set(access.centers)
      const inView = (record: { centerId: string }) =>
        visible.has(record.centerId)
      const bookings = db.bookings
        .findMany((q) => q.where({ personId }))
        .flatMap((booking) => {
          const session = lookups.sessionById(booking.sessionId)
          return session && inView(session) ? [{ booking, session }] : []
        })
        .toSorted((a, b) =>
          b.session.startsAt.localeCompare(a.session.startsAt)
        )
      return {
        person,
        bindings: bindings.filter((b) => {
          if (b.scope === "organization") return true
          if (b.scope === "member") return visible.has(b.homeCenterId)
          return b.scope !== "platform" && visible.has(b.centerId)
        }),
        packages: packages
          .filter(inView)
          // A price is money: hidden together with payments and debts.
          .map((p) =>
            access.money
              ? p
              : Object.assign({}, p, {
                  price: { currency: p.price.currency, amountMinor: 0 },
                })
          ),
        bookings,
        finance: access.money
          ? {
              payments: db.payments
                .findMany((q) => q.where({ organizationId, personId }))
                .filter(inView),
              debts: db.debts
                .findMany((q) => q.where({ organizationId, personId }))
                .filter(inView),
            }
          : null,
        readOnly: access.readOnly,
      }
    }),

    handle(peopleInvite, ({ centerId, firstName, lastName, email }) =>
      write(async () => {
        const center = lookups.centerOf(centerId)
        if (!center) return problem("not_found")
        if (!mayInvite(centerId)) return problem("forbidden")
        const { organizationId } = center
        const address = email.toLowerCase()
        const existing = db.people.findFirst((q) =>
          q.where({ email: (value) => value.toLowerCase() === address })
        )
        if (existing && invitationOf(existing.id, organizationId)) {
          return refuse("already_member")
        }
        const limit = lookups.planOf(organizationId)?.limits.activeStudents
        if (
          limit?.kind === "limited" &&
          organizationUsage(db, organizationId).activeStudents >= limit.max
        ) {
          return refuse("plan_limit")
        }
        const createdAt = now().toISOString()
        // One person is one account (ADR-001): a known e-mail gets a new binding.
        const person: Person = existing ?? {
          id: ids("per"),
          firstName,
          lastName,
          email: address,
          phone: null,
          locale: "tr",
          accountStatus: "invited",
          createdAt,
        }
        if (!existing) await db.people.create(person)
        else if (existing.accountStatus === "none") {
          await db.people.update((q) => q.where({ id: existing.id }), {
            data(draft) {
              draft.accountStatus = "invited"
            },
          })
          person.accountStatus = "invited"
        }
        const binding: Binding = {
          id: ids("bnd"),
          personId: person.id,
          status: "invited",
          createdAt,
          scope: "member",
          organizationId,
          homeCenterId: centerId,
        }
        await db.bindings.create(binding)
        return { person, binding }
      })
    ),

    handle(peopleInviteResend, ({ organizationId, personId }) => {
      const invitation = invitationOf(personId, organizationId)
      if (!invitation || invitation.binding.scope !== "member") {
        return problem("not_found")
      }
      if (!mayInvite(invitation.binding.homeCenterId)) {
        return problem("forbidden")
      }
      if (invitation.binding.status !== "invited") return refuse("not_invited")
      return invitation
    }),
  ]
}
