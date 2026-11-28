import { devices, type Project } from "@playwright/test"

/** The four required device profiles (ADR-009). Dark theme is the primary focus. */
const shared = {
  locale: "tr-TR",
  timezoneId: "Europe/Istanbul",
  colorScheme: "dark",
} as const

export const profiles: Project[] = [
  {
    name: "desktop-chromium",
    use: { ...devices["Desktop Chrome"], ...shared },
  },
  { name: "pixel-7", use: { ...devices["Pixel 7"], ...shared } },
  { name: "desktop-webkit", use: { ...devices["Desktop Safari"], ...shared } },
  {
    name: "iphone-15",
    // A different device time zone exercises the center-time-zone rule (ADR-008).
    use: { ...devices["iPhone 15"], ...shared, timezoneId: "America/New_York" },
  },
]

export const desktopChromium = profiles[0]
export const iphone15 = profiles[3]
