import { expect, test } from "@playwright/test"
import { freezeClock } from "../support/clock"

test("home page", async ({ page }) => {
  await freezeClock(page)
  await page.goto("/")
  await expect(page.getByText("Örnek veri hizmeti hazır.")).toBeVisible()
  await expect(page).toHaveScreenshot("home.png", { fullPage: true })
})
