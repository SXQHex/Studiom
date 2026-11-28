import { expect, test } from "@playwright/test"

import { axeViolations } from "../support/axe"

test("sign in has no WCAG 2.2 AA violations", async ({ page }) => {
  await page.goto("/auth/login")
  await expect(
    page.getByRole("list", { name: "Örnek kullanıcılar" })
  ).toBeVisible()
  expect(await axeViolations(page)).toEqual([])
})
