import { expect, test } from "@playwright/test"

import { freezeClock } from "../support/clock"
import { signIn } from "../support/sign-in"

test("studio shell", async ({ page }) => {
  await freezeClock(page)
  await signIn(page, "Pro sahibi (Ritim)", "studio")
  await page.goto("/studio/center/program/calendar")
  await expect(
    page.getByRole("heading", { level: 1, name: "Takvim" })
  ).toBeVisible()
  await expect(page).toHaveScreenshot("studio-shell.png")
})
