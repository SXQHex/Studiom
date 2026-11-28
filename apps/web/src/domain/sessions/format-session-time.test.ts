import { describe, expect, test } from "vitest"

import { formatSessionTime } from "./format-session-time"

describe("formatSessionTime", () => {
  test("Istanbul keeps UTC+3 all year", () => {
    expect(
      formatSessionTime("2026-01-15T15:30:00Z", "Europe/Istanbul", "tr")
    ).toBe("18:30")
    expect(
      formatSessionTime("2026-07-15T15:30:00Z", "Europe/Istanbul", "tr")
    ).toBe("18:30")
  })

  test("Berlin moves to summer time on 29 March 2026", () => {
    // 17:00 UTC is 18:00 CET the day before and 19:00 CEST the day after.
    expect(
      formatSessionTime("2026-03-28T17:00:00Z", "Europe/Berlin", "tr")
    ).toBe("18:00")
    expect(
      formatSessionTime("2026-03-29T17:00:00Z", "Europe/Berlin", "tr")
    ).toBe("19:00")
  })

  test("Berlin returns to winter time on 25 October 2026", () => {
    expect(
      formatSessionTime("2026-10-24T16:00:00Z", "Europe/Berlin", "tr")
    ).toBe("18:00")
    expect(
      formatSessionTime("2026-10-25T16:00:00Z", "Europe/Berlin", "tr")
    ).toBe("17:00")
  })

  test("the same instant shows the center's time, whatever the device zone", () => {
    const utc = "2026-11-28T15:30:00Z"
    expect(formatSessionTime(utc, "Europe/Istanbul", "tr")).toBe("18:30")
    expect(formatSessionTime(utc, "Europe/Berlin", "tr")).toBe("16:30")
  })

  test("the locale shapes the text, not the clock", () => {
    const options = {
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
    } as const
    const utc = "2026-11-28T15:30:00Z"
    expect(formatSessionTime(utc, "Europe/Istanbul", "tr", options)).toBe(
      "Cumartesi 18:30"
    )
    expect(formatSessionTime(utc, "Europe/Istanbul", "en", options)).toBe(
      "Saturday 06:30 PM"
    )
  })
})
