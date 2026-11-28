import { expect, test } from "@playwright/test";
import { axeViolations } from "../support/axe";

test("home page has no WCAG 2.2 AA violations", async ({ page }) => {
  await page.goto("/");
  expect(await axeViolations(page)).toEqual([]);
});
