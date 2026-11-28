import { peopleList } from "@workspace/contracts/person"
import { createMockServer } from "@workspace/mocks/node"
import { afterAll, afterEach, beforeAll, expect, test } from "vitest"

import { ApiRequestError, callOperation } from "./client"

const mock = await createMockServer()
beforeAll(() => mock.server.listen({ onUnhandledFrame: "error" }))
afterEach(() => mock.setScenario(null))
afterAll(() => mock.server.close())

test("a successful call is parsed with the contract", async () => {
  const page = await callOperation(peopleList, {
    organizationId: "org_starter",
    scope: "instructor",
  })
  expect(page.items.map((p) => p.id)).toEqual(["per_ayse"])
})

test("a failed call throws the contract's error code", async () => {
  mock.setScenario("forbidden")
  await expect(
    callOperation(peopleList, { organizationId: "org_starter" })
  ).rejects.toEqual(new ApiRequestError(403, "forbidden"))
})

test("input is checked before it leaves the app", async () => {
  await expect(
    // @ts-expect-error: a missing organization is a compile error too
    callOperation(peopleList, {})
  ).rejects.toThrow()
})
