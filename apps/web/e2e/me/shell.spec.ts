import { expect, test } from "@playwright/test"

import { menu, signIn } from "../support/sign-in"

test("only instructors see Talepler", async ({ page }) => {
  await signIn(page, "Eğitmen (Ritim)", "me")
  await expect(
    menu(page, "Modüller").getByRole("link", { name: "Talepler" })
  ).toBeVisible()

  await signIn(page, "Üye, iki stüdyoda", "me")
  await expect(
    menu(page, "Modüller").getByRole("link", { name: "Cüzdan" })
  ).toBeVisible()
  await expect(
    menu(page, "Modüller").getByRole("link", { name: "Talepler" })
  ).toHaveCount(0)
  await menu(page, "Modüller").getByRole("link", { name: "Cüzdan" }).click()
  await expect(page).toHaveURL(/\/me\/wallet$/)
  await expect(
    page.getByRole("heading", { level: 1, name: "Cüzdan" })
  ).toBeVisible()
})

test("a member has no Studio shell", async ({ page }) => {
  await signIn(page, "Üye, iki stüdyoda", "me")
  await page.goto("/studio")
  await expect(
    page.getByRole("heading", { level: 1, name: "Bu alana erişimin yok" })
  ).toBeVisible()
})
