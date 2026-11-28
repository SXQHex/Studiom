import type { Binding } from "@workspace/contracts/person"
import { beforeEach, expect, test, vi } from "vitest"

import { lastUsedBinding, rememberBinding } from "./last-binding"

// Node has no working Web Storage without a file, so the test brings a small one.
beforeEach(() => {
  const items = new Map<string, string>()
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => items.set(key, value),
  })
})

const binding = (id: string): Binding => ({
  id,
  personId: "per_test",
  status: "active",
  createdAt: "2026-01-01T00:00:00.000Z",
  scope: "member",
  organizationId: "org_pro",
  homeCenterId: "ctr_pro_kadikoy",
})

test("the last used binding is remembered and must still be held", () => {
  const first = binding("bnd_1")
  const second = binding("bnd_2")
  expect(lastUsedBinding([first, second])).toBeNull()
  rememberBinding(second)
  expect(lastUsedBinding([first, second])).toBe(second)
  // A binding that was removed in the meantime is not offered again.
  expect(lastUsedBinding([first])).toBeNull()
})
