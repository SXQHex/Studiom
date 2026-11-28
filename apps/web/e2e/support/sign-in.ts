import { expect, type Page } from "@playwright/test"

/** Signs in through the sample user list, the way the app offers it (ADR-007). */
export async function signIn(page: Page, user: string, shell: string) {
  await page.goto("/auth/login")
  await page.getByRole("button", { name: user }).click()
  await expect(page).toHaveURL(new RegExp(`/${shell}/`))
  // The shell's own address redirects once more; the heading marks the end.
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
}

export function isPhone(page: Page) {
  return (page.viewportSize()?.width ?? 0) < 768
}

/** The visible menu: the sidebar on a desktop, the bars on a phone. */
export function menu(page: Page, name: "Modüller" | "Sayfalar") {
  return page.getByRole("navigation", { name })
}
