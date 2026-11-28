import type { LimitKey } from "@workspace/contracts/plan"

import type { MockDb } from "./store"

/** Current usage of every limit key for one organization, counted from the store. */
export function organizationUsage(
  db: MockDb,
  organizationId: string
): Record<LimitKey, number> {
  const centers = db.centers.findMany((q) =>
    q.where({ organizationId, status: "active" })
  )
  const centerIds = new Set(centers.map((c) => c.id))
  const bindings = db.bindings.findMany((q) =>
    q.where({ organizationId, status: "active" })
  )
  const instructors = new Set(
    bindings
      .filter((b) => b.scope === "instructor" && b.role === "instructor")
      .map((b) => b.personId)
  )
  return {
    centers: centers.length,
    rooms: db.rooms.findMany((q) =>
      q.where({ status: "active", centerId: (id) => centerIds.has(id) })
    ).length,
    disciplines: db.disciplines.findMany((q) =>
      q.where({ organizationId, status: "active" })
    ).length,
    instructors: instructors.size,
    activeStudents: bindings.filter((b) => b.scope === "member").length,
  }
}
