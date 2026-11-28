import type { Binding } from "@workspace/contracts/person"
import { describe, expect, test } from "vitest"

import { shellBindings, shellModules, shellPageAccess } from "./navigation"

const base = {
  personId: "per_1",
  status: "active",
  createdAt: "2026-01-01T00:00:00Z",
} as const

const owner: Binding = {
  ...base,
  id: "bnd_org",
  scope: "organization",
  organizationId: "org_a",
  role: "owner",
}
const staff: Binding = {
  ...base,
  id: "bnd_staff",
  scope: "center",
  organizationId: "org_a",
  centerId: "ctr_a",
  role: "staff",
  modules: ["people"],
}
const otherTenant: Binding = {
  ...base,
  id: "bnd_other",
  scope: "center",
  organizationId: "org_b",
  centerId: "ctr_b",
  role: "center_manager",
  modules: [],
}

describe("shell bindings", () => {
  test("Studio shows one organization with both of its groups", () => {
    const selection = shellBindings("studio", [owner, otherTenant, staff], null)
    expect(selection?.groups).toEqual({ organization: owner, center: staff })
  })

  test("the last used binding picks the tenant", () => {
    const selection = shellBindings("studio", [owner, otherTenant], otherTenant)
    expect(selection?.groups).toEqual({ center: otherTenant })
  })

  test("a shell without a binding is closed", () => {
    expect(shellBindings("platform", [owner], null)).toBeNull()
  })
})

describe("page access", () => {
  const selection = shellBindings("studio", [staff], null)
  const context = { bindings: [staff] }

  test("staff open Today and the modules their manager chose", () => {
    if (!selection) throw new Error("missing selection")
    expect(shellModules(selection, context).map((m) => m.id)).toEqual([
      "today",
      "people",
    ])
  })

  test("other addresses say why they do not open", () => {
    if (!selection) throw new Error("missing selection")
    const access = (
      group: "center" | "organization",
      module: string,
      page: string
    ) => shellPageAccess(selection, context, { group, module, page })
    expect(access("center", "people", "members")).toBe("open")
    expect(access("center", "sales", "debts")).toBe("forbidden")
    expect(access("organization", "oversight", "people")).toBe("forbidden")
    expect(access("center", "people", "nothing")).toBe("unknown")
  })

  test("a page the plan lacks is reported as such", () => {
    const manager = shellBindings("studio", [otherTenant], null)
    if (!manager) throw new Error("missing selection")
    expect(
      shellPageAccess(
        manager,
        { bindings: [otherTenant] },
        { group: "center", module: "program", page: "waitlists" }
      )
    ).toBe("outOfPlan")
  })
})
