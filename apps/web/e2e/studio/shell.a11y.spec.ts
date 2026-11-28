import { expect, test } from "@playwright/test"

import { axeViolations } from "../support/axe"
import { signIn } from "../support/sign-in"

test("the Studio shell has no WCAG 2.2 AA violations", async ({ page }) => {
  await signIn(page, "Pro sahibi (Ritim)", "studio")
  await page.goto("/studio/center/program/calendar")
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  expect(await axeViolations(page)).toEqual([])

  await page.getByRole("button", { name: "Tema" }).click()
  await expect(page.getByRole("menu")).toBeVisible()
  // Overlays fade in; contrast is measured once they are opaque.
  await expect(page.locator('[data-slot="dropdown-menu-content"]')).toHaveCSS(
    "opacity",
    "1"
  )
  expect(await axeViolations(page)).toEqual([])
  await page.keyboard.press("Escape")
  await expect(page.getByRole("menu")).toBeHidden()

  await page.getByRole("button", { name: "Bildirimler" }).click()
  await expect(page.getByRole("dialog", { name: "Bildirimler" })).toContainText(
    "Yeni bildirim yok"
  )
  await expect(page.locator('[data-slot="sheet-content"]')).toHaveCSS(
    "opacity",
    "1"
  )
  expect(await axeViolations(page)).toEqual([])
})
