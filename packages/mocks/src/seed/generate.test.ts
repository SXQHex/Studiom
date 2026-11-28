import { fromDate, toCalendarDate } from "@internationalized/date"
import { limitKeys } from "@workspace/contracts/plan"
import { describe, expect, test } from "vitest"

import { createDb } from "../store"
import { organizationUsage } from "../usage"
import { generateDataset, type Dataset } from "./generate"

// The seed follows "now" (ADR-007), so the checks run around several instants,
// including both daylight saving changes in Berlin.
const instants = [
  new Date(),
  new Date("2026-03-29T00:30:00Z"),
  new Date("2026-10-25T00:30:00Z"),
  new Date("2026-11-28T15:00:00Z"),
]

const byId = <T extends { id: string }>(items: readonly T[]) =>
  new Map(items.map((item) => [item.id, item]))

describe.each(instants)("dataset around %s", (now) => {
  const data: Dataset = generateDataset({ now })
  const nowIso = now.toISOString()
  const centers = byId(data.centers)
  const sessions = byId(data.sessions)
  const templates = byId(data.packageTemplates)
  const packages = byId(data.packages)

  const activeMembers = (organizationId: string) =>
    data.bindings.filter(
      (b) =>
        b.scope === "member" &&
        b.status === "active" &&
        b.organizationId === organizationId
    )

  test("active students match ADR-007: Starter 97, Pro 150, Business 300", () => {
    expect(activeMembers("org_starter")).toHaveLength(97)
    expect(activeMembers("org_pro")).toHaveLength(150)
    expect(activeMembers("org_business")).toHaveLength(300)
  })

  test("Business has three centers, one in Berlin", () => {
    const own = data.centers.filter((c) => c.organizationId === "org_business")
    expect(own).toHaveLength(3)
    expect(own.filter((c) => c.timeZone === "Europe/Berlin")).toHaveLength(1)
  })

  test("one person holds platform, owner, center manager and instructor bindings", () => {
    const scopes = data.bindings
      .filter((b) => b.personId === "per_deniz")
      .map((b) => b.scope)
      .toSorted()
    expect(scopes).toEqual(["center", "instructor", "organization", "platform"])
  })

  test("every reference points to an existing record", () => {
    const people = byId(data.people)
    const orgs = byId(data.organizations)
    const rooms = byId(data.rooms)
    const disciplines = byId(data.disciplines)
    for (const b of data.bindings) {
      expect(people.has(b.personId)).toBe(true)
      if (b.scope !== "platform") expect(orgs.has(b.organizationId)).toBe(true)
    }
    for (const s of data.sessions) {
      const room = rooms.get(s.roomId)
      expect(room?.centerId).toBe(s.centerId)
      const org = centers.get(s.centerId)?.organizationId
      expect(disciplines.get(s.disciplineId)?.organizationId).toBe(org)
    }
    for (const b of data.bookings) {
      expect(sessions.has(b.sessionId)).toBe(true)
      expect(people.has(b.personId)).toBe(true)
      if (b.packageId !== null) {
        expect(packages.get(b.packageId)?.personId).toBe(b.personId)
      }
    }
    for (const l of data.leads) {
      expect(people.get(l.personId)?.accountStatus).toBe("none")
    }
  })

  test("usage stays within every plan limit", async () => {
    const db = await createDb(data)
    for (const org of data.organizations) {
      const plan = data.plans.find((p) => p.id === org.planId)
      const usage = organizationUsage(db, org.id)
      for (const key of limitKeys) {
        const limit = plan?.limits[key]
        if (limit?.kind === "limited") {
          expect(usage[key]).toBeLessThanOrEqual(limit.max)
        }
      }
    }
    expect(organizationUsage(db, "org_starter").activeStudents).toBe(97)
  })

  test("sessions never take more bookings than capacity", () => {
    const counts = new Map<string, number>()
    for (const b of data.bookings) {
      if (b.status === "cancelled" || b.status === "waitlisted") continue
      counts.set(b.sessionId, (counts.get(b.sessionId) ?? 0) + 1)
    }
    for (const [sessionId, count] of counts) {
      expect(count).toBeLessThanOrEqual(sessions.get(sessionId)?.capacity ?? 0)
    }
  })

  test("booked roles stay within each role's places", () => {
    for (const session of data.sessions) {
      const quota = session.options.roleCapacity
      if (!quota) continue
      for (const role of ["leader", "follower"] as const) {
        const taken = data.bookings.filter(
          (b) =>
            b.sessionId === session.id &&
            b.role === role &&
            !b.isMakeup &&
            b.status !== "cancelled" &&
            b.status !== "waitlisted"
        )
        expect(taken.length).toBeLessThanOrEqual(quota[role])
      }
    }
  })

  test("past sessions have attendance with its taker, future ones none", () => {
    for (const b of data.bookings) {
      const session = sessions.get(b.sessionId)
      if (!session) continue
      if (b.status === "attended" || b.status === "no_show") {
        expect(session.endsAt <= nowIso).toBe(true)
        expect(b.attendanceTakenBy).not.toBeNull()
      }
      if (b.status === "booked") expect(session.endsAt > nowIso).toBe(true)
    }
  })

  test("credits used equal the bookings drawn from each package", () => {
    const drawn = new Map<string, number>()
    for (const b of data.bookings) {
      if (b.packageId === null) continue
      if (b.status === "cancelled" || b.status === "waitlisted") continue
      drawn.set(b.packageId, (drawn.get(b.packageId) ?? 0) + 1)
    }
    for (const pkg of data.packages) {
      expect(pkg.creditsUsed).toBe(drawn.get(pkg.id) ?? 0)
      if (pkg.creditsTotal !== null) {
        expect(pkg.creditsUsed).toBeLessThanOrEqual(pkg.creditsTotal)
      }
    }
  })

  test("bookings fall inside the package's validity and disciplines", () => {
    for (const b of data.bookings) {
      if (b.packageId === null) continue
      const pkg = packages.get(b.packageId)
      const session = sessions.get(b.sessionId)
      const center = session && centers.get(session.centerId)
      if (!pkg || !session || !center) throw new Error("dangling booking")
      const day = toCalendarDate(
        fromDate(new Date(session.startsAt), center.timeZone)
      ).toString()
      expect(day >= pkg.startsOn && day < pkg.expiresOn).toBe(true)
      expect(templates.get(pkg.templateId)?.disciplineIds).toContain(
        session.disciplineId
      )
    }
  })

  test("debt equals price minus payments, in the package currency", () => {
    for (const pkg of data.packages) {
      const paid = data.payments
        .filter((p) => p.packageId === pkg.id)
        .reduce(
          (sum, p) =>
            sum + (p.kind === "refund" ? -1 : 1) * p.amount.amountMinor,
          0
        )
      const debt = data.debts.find((d) => d.packageId === pkg.id)
      expect(paid + (debt?.amount.amountMinor ?? 0)).toBe(pkg.price.amountMinor)
      expect(debt?.amount.currency ?? pkg.price.currency).toBe(
        centers.get(pkg.centerId)?.currency
      )
    }
  })

  test("Berlin sessions follow Berlin wall-clock time across DST", () => {
    const berlin = data.sessions.filter((s) => s.centerId === "ctr_biz_berlin")
    const hours = new Set(
      berlin.map((s) =>
        new Intl.DateTimeFormat("en-GB", {
          timeZone: "Europe/Berlin",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(s.startsAt))
      )
    )
    expect([...hours].toSorted()).toEqual(["08:00", "18:00"])
  })

  test("there is something to show today and soon", () => {
    expect(
      data.packages.some((p) => {
        const center = centers.get(p.centerId)
        if (!center) return false
        const today = toCalendarDate(fromDate(now, center.timeZone))
        return p.expiresOn === today.add({ days: 3 }).toString()
      })
    ).toBe(true)
    expect(data.sessions.some((s) => s.status === "cancelled")).toBe(true)
    expect(data.bookings.some((b) => b.status === "waitlisted")).toBe(true)
  })
})

test("the same seed and instant give the same dataset", () => {
  const now = new Date("2026-11-28T15:00:00Z")
  expect(generateDataset({ now })).toEqual(generateDataset({ now }))
})
