import { expect, test } from "@playwright/test"
import { axeViolations } from "../support/axe"

test("home page has no WCAG 2.2 AA violations", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByText("Örnek veri hizmeti hazır.")).toBeVisible()
  expect(await axeViolations(page)).toEqual([])
})

test("not found page has no WCAG 2.2 AA violations", async ({ page }) => {
  await page.goto("/unknown")
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
  expect(await axeViolations(page)).toEqual([])
})
