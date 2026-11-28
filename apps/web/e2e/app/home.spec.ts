import { expect, test } from "@playwright/test"

test("home page shows the app name", async ({ page }) => {
  await page.goto("/")
  await expect(
    page.getByRole("heading", { level: 1, name: "Studiom" })
  ).toBeVisible()
  // The mock service worker answered the health request.
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
