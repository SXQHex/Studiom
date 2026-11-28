import { capabilitiesGet } from "@workspace/contracts/plan"
import {
  peopleList,
  sessionCurrent,
  signInAs,
} from "@workspace/contracts/person"
import { sessionsList } from "@workspace/contracts/schedule"
import { afterAll, beforeAll, beforeEach, expect, test } from "vitest"

import { createMockServer } from "./node"

const origin = "http://studiom.test"
const { server, setScenario, signIn } = await createMockServer()

beforeAll(() => server.listen({ onUnhandledFrame: "error" }))
afterAll(() => server.close())
beforeEach(() => {
  setScenario(null)
  signIn(null)
})

const call = (op: { path: string }, body: unknown = {}) =>
  fetch(`${origin}${op.path}`, { method: "POST", body: JSON.stringify(body) })

test("signing in as a sample person returns their bindings", async () => {
  expect(await (await call(sessionCurrent)).json()).toBeNull()
  const response = await call(signInAs, { personId: "per_deniz" })
  const session = signInAs.response.parse(await response.json())
  expect(session.bindings).toHaveLength(4)
  expect(
    sessionCurrent.response.parse(await (await call(sessionCurrent)).json())
      ?.person.id
  ).toBe("per_deniz")
})

test("capabilities carry the plan and the usage", async () => {
  const body = capabilitiesGet.response.parse(
    await (
      await call(capabilitiesGet, { organizationId: "org_starter" })
    ).json()
  )
  expect(body.plan.id).toBe("starter")
  expect(body.usage.activeStudents).toBe(97)
})

test("lists are paged and include pending invitations", async () => {
  const body = peopleList.response.parse(
    await (
      await call(peopleList, {
        organizationId: "org_pro",
        scope: "member",
        pageSize: 20,
      })
    ).json()
  )
  expect(body.items).toHaveLength(20)
  // 150 active students plus two open invitations.
  expect(body.total).toBe(152)
})

test("an invalid request is answered with 400", async () => {
  const response = await call(sessionsList, { from: "yesterday" })
  expect(response.status).toBe(400)
  expect(await response.json()).toMatchObject({ code: "invalid" })
})

test.each([
  ["error", 500, "internal"],
  ["forbidden", 403, "forbidden"],
] as const)("the %s scenario answers %i", async (name, status, code) => {
  setScenario(name)
  const response = await call(peopleList, { organizationId: "org_pro" })
  expect(response.status).toBe(status)
  expect(await response.json()).toEqual({ code })
  // The shell still loads: session and capabilities are exempt.
  expect(
    (await call(capabilitiesGet, { organizationId: "org_pro" })).status
  ).toBe(200)
})

test("the empty scenario empties lists", async () => {
  setScenario("empty")
  const body = peopleList.response.parse(
    await (await call(peopleList, { organizationId: "org_pro" })).json()
  )
  expect(body).toEqual({ items: [], total: 0 })
})

test("the slow scenario delays the answer", async () => {
  setScenario("slow")
  const started = Date.now()
  const response = await call(peopleList, { organizationId: "org_pro" })
  expect(response.status).toBe(200)
  expect(Date.now() - started).toBeGreaterThanOrEqual(2_000)
})
