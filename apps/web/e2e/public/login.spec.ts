import { expect, test } from "@playwright/test"

test("a shell sends a signed-out visitor to sign in", async ({ page }) => {
  await page.goto("/studio/center/program/calendar")
  await expect(page).toHaveURL(/\/auth\/login$/)
  await expect(
    page.getByRole("list", { name: "Örnek kullanıcılar" })
  ).toBeVisible()
})
