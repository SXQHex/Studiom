import { expect, test } from "@playwright/test"

test("home page shows the app name", async ({ page }) => {
  await page.goto("/")
  await expect(
    page.getByRole("heading", { level: 1, name: "Studiom" })
  ).toBeVisible()
  // The mock service worker answered the health request.
  await expect(page.getByText("Örnek veri hizmeti hazır.")).toBeVisible()
})

test("a failing data service shows an error that can be retried", async ({
  page,
}) => {
  // Fails the first call and its three automatic retries.
  await page.addInitScript(() => {
    const realFetch = window.fetch
    let failures = 4
    window.fetch = (input, init) => {
      if (
        typeof input === "string" &&
        input.includes("system_health") &&
        failures > 0
      ) {
        failures -= 1
        return Promise.resolve(new Response(null, { status: 500 }))
      }
      return realFetch(input, init)
    }
  })
  await page.goto("/")
  const alert = page.getByRole("alert")
  await expect(alert).toContainText("Veri yüklenemedi", { timeout: 15_000 })
  await alert.getByRole("button", { name: "Tekrar dene" }).click()
  await expect(page.getByText("Örnek veri hizmeti hazır.")).toBeVisible()
})

test(
  "unknown paths show the not found page with a way home",
  { tag: "@smoke" },
  async ({ page }) => {
    await page.goto("/studio/center/today")
    await page.getByRole("link", { name: "Back to home" }).click()
    await expect(
      page.getByRole("heading", { level: 1, name: "Studiom" })
    ).toBeVisible()
  }
)
