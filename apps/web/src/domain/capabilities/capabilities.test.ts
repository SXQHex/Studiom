import type { Binding } from "@workspace/contracts/person"
import type { Capabilities } from "@workspace/contracts/plan"
import { createMockServer } from "@workspace/mocks/node"
import { QueryClient } from "@tanstack/react-query"
import { afterAll, beforeAll, describe, expect, test } from "vitest"

import { currentSessionQuery } from "@/domain/bindings/queries"
import { callOperation } from "@/api/client"
import { signInAs } from "@workspace/contracts/person"

import { can, limit } from "./capabilities"
import { visibleModules, type VisibleModule } from "./modules"
import { capabilitiesQuery } from "./queries"

const mock = await createMockServer()
beforeAll(() => mock.server.listen({ onUnhandledFrame: "error" }))
afterAll(() => mock.server.close())

const client = new QueryClient()
const capabilitiesOf = (organizationId: string): Promise<Capabilities> =>
  client.fetchQuery(capabilitiesQuery(organizationId))

/** Signs in through the API and returns the person's bindings, as the app does. */
async function bindingsOf(personId: string): Promise<Binding[]> {
  await callOperation(signInAs, { personId })
  const session = await client.fetchQuery({
    ...currentSessionQuery,
    staleTime: 0,
  })
  client.removeQueries(currentSessionQuery)
  return session?.bindings ?? []
}

const pagesOf = (modules: VisibleModule[], id: string) =>
  modules.find((m) => m.id === id)?.pages ?? []

describe("plan capabilities", () => {
  test("Starter has no Pro features and is three students from its limit", async () => {
    const starter = await capabilitiesOf("org_starter")
    expect(can(starter, "waitlist")).toBe(false)
    expect(limit(starter, "activeStudents")).toEqual({
      key: "activeStudents",
      used: 97,
      max: 100,
      remaining: 3,
      reached: false,
    })
    expect(limit(starter, "rooms").reached).toBe(true)
  })

  test("Pro rooms have no commercial quota", async () => {
    const pro = await capabilitiesOf("org_pro")
    expect(can(pro, "waitlist")).toBe(true)
    expect(can(pro, "settlement")).toBe(false)
    expect(limit(pro, "rooms")).toMatchObject({ max: null, reached: false })
    expect(limit(pro, "activeStudents")).toMatchObject({ used: 150, max: 250 })
  })

  test("Business has settlement and consolidated reports", async () => {
    const business = await capabilitiesOf("org_business")
    expect(can(business, "settlement")).toBe(true)
    expect(can(business, "consolidatedReports")).toBe(true)
    expect(limit(business, "centers")).toMatchObject({ used: 3, max: 5 })
    expect(limit(business, "activeStudents")).toMatchObject({ used: 300 })
  })
})

describe("visible modules", () => {
  test("a Starter center manager sees no plan-gated pages", async () => {
    const bindings = await bindingsOf("per_ayse")
    const center = bindings.find((b) => b.scope === "center")
    if (!center) throw new Error("missing center binding")
    const modules = visibleModules(center, {
      bindings,
      capabilities: await capabilitiesOf("org_starter"),
    })
    expect(modules.map((m) => m.id)).toEqual([
      "today",
      "program",
      "people",
      "sales",
      "center",
    ])
    expect(pagesOf(modules, "program")).toEqual(["calendar", "privateRequests"])
    expect(pagesOf(modules, "sales")).toEqual([
      "packagePrices",
      "sales",
      "debts",
    ])
  })

  test("Pro opens waitlists, events and payroll but not settlement", async () => {
    const bindings = await bindingsOf("per_mert")
    const center = bindings.find((b) => b.scope === "center")
    if (!center) throw new Error("missing center binding")
    const modules = visibleModules(center, {
      bindings,
      capabilities: await capabilitiesOf("org_pro"),
    })
    expect(pagesOf(modules, "program")).toContain("waitlists")
    expect(pagesOf(modules, "program")).toContain("events")
    expect(pagesOf(modules, "sales")).toContain("payroll")
    expect(pagesOf(modules, "sales")).not.toContain("settlement")
  })

  test("Business opens settlement", async () => {
    const bindings = await bindingsOf("per_deniz")
    const center = bindings.find((b) => b.scope === "center")
    if (!center) throw new Error("missing center binding")
    const modules = visibleModules(center, {
      bindings,
      capabilities: await capabilitiesOf("org_business"),
    })
    expect(pagesOf(modules, "sales")).toContain("settlement")
  })

  test("staff see only the modules their manager opened, plus Today", async () => {
    const bindings = await bindingsOf("per_zeynep")
    const center = bindings.find((b) => b.scope === "center")
    if (!center) throw new Error("missing center binding")
    const modules = visibleModules(center, {
      bindings,
      capabilities: await capabilitiesOf("org_pro"),
    })
    expect(modules.map((m) => m.id)).toEqual([
      "today",
      "program",
      "people",
      "sales",
    ])
  })

  test("oversight is hidden in a one-center organization from its center manager", async () => {
    const bindings = await bindingsOf("per_mert")
    const org = bindings.find((b) => b.scope === "organization")
    if (!org) throw new Error("missing organization binding")
    const pro = await capabilitiesOf("org_pro")
    const ids = visibleModules(org, {
      bindings,
      capabilities: pro,
      centerCount: 1,
    }).map((m) => m.id)
    expect(ids).toEqual(["definitions", "organization"])
  })

  test("a Business org manager sees oversight and the automation page", async () => {
    const bindings = await bindingsOf("per_ozan")
    const org = bindings.find((b) => b.scope === "organization")
    if (!org) throw new Error("missing organization binding")
    const modules = visibleModules(org, {
      bindings,
      capabilities: await capabilitiesOf("org_business"),
      centerCount: 3,
    })
    expect(modules.map((m) => m.id)).toEqual([
      "definitions",
      "oversight",
      "organization",
    ])
    expect(pagesOf(modules, "definitions")).toContain("automation")
  })

  test("requests in Ben are only for people who teach", async () => {
    const member = await bindingsOf("per_ece")
    const memberBinding = member.find((b) => b.scope === "member")
    if (!memberBinding) throw new Error("missing member binding")
    expect(
      visibleModules(memberBinding, { bindings: member }).map((m) => m.id)
    ).not.toContain("requests")

    const instructor = await bindingsOf("per_can")
    const instructorBinding = instructor.find((b) => b.scope === "instructor")
    if (!instructorBinding) throw new Error("missing instructor binding")
    expect(
      visibleModules(instructorBinding, { bindings: instructor }).map(
        (m) => m.id
      )
    ).toContain("requests")
  })
})
