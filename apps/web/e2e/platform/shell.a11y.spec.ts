import { expect, test } from "@playwright/test"

import { axeViolations } from "../support/axe"
import { signIn } from "../support/sign-in"

test("the platform shell has no WCAG 2.2 AA violations", async ({ page }) => {
  await signIn(page, "Platform yöneticisi", "platform")
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  expect(await axeViolations(page)).toEqual([])
})
