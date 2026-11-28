import { expect, test } from "@playwright/test"

import { menu, signIn } from "../support/sign-in"

test("the platform shell lists its own menu", async ({ page }) => {
  await signIn(page, "Platform yöneticisi", "platform")
  await menu(page, "Modüller").getByRole("link", { name: "Kiracılar" }).click()
  await menu(page, "Sayfalar").getByRole("link", { name: "Denemeler" }).click()
  await expect(page).toHaveURL(/\/platform\/tenants\/trials$/)
  await expect(page.getByRole("banner")).toHaveAttribute(
    "data-shell",
    "platform"
  )
})
