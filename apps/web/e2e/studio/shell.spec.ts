import { expect, test } from "@playwright/test"

import { isPhone, menu, signIn } from "../support/sign-in"

const pro = "Pro sahibi (Ritim)"
const starter = "Starter sahibi (Nefes Yoga)"
const staff = "Personel, resepsiyon (Ritim)"

test("modules and their pages lead to one address each", async ({ page }) => {
  await signIn(page, pro, "studio")
  await menu(page, "Modüller").getByRole("link", { name: "Program" }).click()
  await expect(page).toHaveURL(/\/studio\/center\/program\/calendar$/)
  await menu(page, "Sayfalar")
    .getByRole("link", { name: "Bekleme listeleri" })
    .click()
  await expect(
    page.getByRole("heading", { level: 1, name: "Bekleme listeleri" })
  ).toBeVisible()
  await expect(
    menu(page, "Sayfalar").getByRole("link", { name: "Bekleme listeleri" })
  ).toHaveAttribute("aria-current", "page")
  // One click is one history entry.
  await page.goBack()
  await expect(page).toHaveURL(/\/studio\/center\/program\/calendar$/)
})

test("a plan hides what it does not include", async ({ page }) => {
  await signIn(page, starter, "studio")
  await menu(page, "Modüller").getByRole("link", { name: "Program" }).click()
  await expect(
    menu(page, "Sayfalar").getByRole("link", { name: "Takvim" })
  ).toBeVisible()
  await expect(
    menu(page, "Sayfalar").getByRole("link", { name: "Bekleme listeleri" })
  ).toHaveCount(0)
  // One center, run by the owner: no oversight copy of the same data.
  await expect(
    menu(page, "Modüller").getByRole("link", { name: "Gözetim" })
  ).toHaveCount(0)

  await page.goto("/studio/center/program/waitlists")
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Bekleme listeleri mevcut planında yok",
    })
  ).toBeVisible()
})

test("staff open only the modules their manager chose", async ({ page }) => {
  await signIn(page, staff, "studio")
  await expect(
    menu(page, "Modüller").getByRole("link", { name: "Satış" })
  ).toBeVisible()
  await expect(
    menu(page, "Modüller").getByRole("link", { name: "Merkez" })
  ).toHaveCount(0)

  await page.goto("/studio/center/center/team")
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Bu sayfaya erişimin yok",
    })
  ).toBeVisible()
  await page.goto("/studio/center/center/nothing")
  await expect(
    page.getByRole("heading", { level: 1, name: "Sayfa bulunamadı" })
  ).toBeVisible()
})

test("the desktop panel collapses to the icon rail", async ({ page }) => {
  test.skip(isPhone(page), "Phones have no sidebar")
  await signIn(page, pro, "studio")
  await menu(page, "Modüller").getByRole("link", { name: "Program" }).click()
  const pageLink = menu(page, "Sayfalar").getByRole("link", { name: "Takvim" })
  await expect(pageLink).toBeVisible()
  const toggle = page.getByRole("button", {
    name: "Menüyü daralt veya genişlet",
  })
  await toggle.click()
  await expect(pageLink).toBeHidden()
  await expect(
    menu(page, "Modüller").getByRole("link", { name: "Satış" })
  ).toBeVisible()
  // The choice survives a reload.
  await page.reload()
  await expect(pageLink).toBeHidden()
  await toggle.click()
  await expect(pageLink).toBeVisible()
})

test("icon only modules show their name on hover", async ({ page }) => {
  test.skip(isPhone(page), "Phones show the names under the icons")
  await signIn(page, pro, "studio")
  await menu(page, "Modüller").getByRole("link", { name: "Satış" }).hover()
  await expect(page.getByRole("tooltip")).toHaveText("Satış")
})

test("the phone bar keeps the current module in sight", async ({ page }) => {
  test.skip(!isPhone(page), "Desktops show every module")
  await signIn(page, "Platform sahibi, Mavi Hareket", "platform")
  await page.goto("/studio/organization/organization/ownership")
  await expect(
    menu(page, "Modüller").getByRole("link", { name: "Organizasyon" })
  ).toBeInViewport({ ratio: 0.9 })
  await expect(
    menu(page, "Sayfalar").getByRole("link", { name: "Sahiplik ve kapatma" })
  ).toBeInViewport({ ratio: 0.9 })
})

test("theme and contrast are chosen in the header and kept", async ({
  page,
}) => {
  await signIn(page, pro, "studio")
  const html = page.locator("html")
  await page.getByRole("button", { name: "Tema" }).click()
  await page.getByRole("menuitemradio", { name: "Açık" }).click()
  await expect(html).toHaveClass(/light/)
  await page.getByRole("button", { name: "Tema" }).click()
  await page.getByRole("menuitemcheckbox", { name: "Yüksek kontrast" }).click()
  await expect(html).toHaveAttribute("data-contrast", "high")
  await page.reload()
  await expect(html).toHaveClass(/light/)
  await expect(html).toHaveAttribute("data-contrast", "high")
})

test("the bell opens the notification panel", async ({ page }) => {
  await signIn(page, pro, "studio")
  await page.getByRole("button", { name: "Bildirimler" }).click()
  const panel = page.getByRole("dialog")
  await expect(panel).toContainText("Yeni bildirim yok")
  await panel.getByRole("button", { name: "Kapat" }).last().click()
  await expect(panel).toBeHidden()
})
