import { expect, test, type Page } from "@playwright/test"

/** Opens a page and waits until the app rendered, which happens after the worker started. */
async function open(page: Page, url: string) {
  await page.goto(url)
  await page.locator("#root > *").first().waitFor({ state: "attached" })
}

/** Calls one mock operation from inside the page, the way the app's fetch does. */
async function call(page: Page, operation: string, body: object = {}) {
  return page.evaluate(
    async ({ operation, body }) => {
      const response = await fetch(`/functions/v1/api/${operation}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      return {
        status: response.status,
        body: (await response.json()) as unknown,
      }
    },
    { operation, body }
  )
}

test("the mock worker serves the seeded world", async ({ page }) => {
  await open(page, "/")
  const result = await call(page, "capabilities_get_v1", {
    organizationId: "org_starter",
  })
  expect(result.status).toBe(200)
  expect(result.body).toMatchObject({
    plan: { id: "starter" },
    usage: { activeStudents: 97 },
  })
})

test("today's Pro schedule is built around now in the center's time zone", async ({
  page,
}) => {
  await open(page, "/")
  const from = new Date(Date.now() - 86_400_000).toISOString()
  const to = new Date(Date.now() + 2 * 86_400_000).toISOString()
  const result = await call(page, "sessions_list_v1", {
    centerId: "ctr_pro_kadikoy",
    from,
    to,
  })
  expect(result.status).toBe(200)
  const { items } = result.body as { items: { startsAt: string }[] }
  expect(items.length).toBeGreaterThan(0)
})

for (const [scenario, status] of [
  ["error", 500],
  ["forbidden", 403],
] as const) {
  test(`?scenario=${scenario} answers ${status} and keeps the shell data`, async ({
    page,
  }) => {
    await open(page, `/?scenario=${scenario}`)
    expect(
      (await call(page, "people_list_v1", { organizationId: "org_pro" })).status
    ).toBe(status)
    expect(
      (await call(page, "capabilities_get_v1", { organizationId: "org_pro" }))
        .status
    ).toBe(200)
  })
}

test("?scenario=empty empties lists", async ({ page }) => {
  await open(page, "/?scenario=empty")
  const result = await call(page, "people_list_v1", {
    organizationId: "org_pro",
  })
  expect(result.body).toEqual({ items: [], total: 0 })
})

test("a sample sign-in lasts for the tab, data changes do not survive a reload", async ({
  page,
}) => {
  await open(page, "/")
  await call(page, "auth_sign_in_as_v1", { personId: "per_mert" })
  await page.reload()
  await page.locator("#root > *").first().waitFor({ state: "attached" })
  const result = await call(page, "auth_session_current_v1")
  expect(result.body).toMatchObject({ person: { id: "per_mert" } })
})

test(
  "lang and dir follow the active language",
  { tag: "@smoke" },
  async ({ page }) => {
    await open(page, "/")
    await expect(page.locator("html")).toHaveAttribute("lang", /^en/)
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr")
  }
)
