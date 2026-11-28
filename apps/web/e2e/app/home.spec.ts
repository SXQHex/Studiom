import { expect, test } from "@playwright/test"

test("home page shows the app name", async ({ page }) => {
  await page.goto("/")
  await expect(
    page.getByRole("heading", { level: 1, name: "Studiom" })
  ).toBeVisible()
})

test(
  "unknown paths fall back to the app",
  { tag: "@smoke" },
  async ({ page }) => {
    await page.goto("/studio/center/today")
    await expect(
      page.getByRole("heading", { level: 1, name: "Studiom" })
    ).toBeVisible()
  }
)
