import { DateFormatter } from "@internationalized/date"

const timeOnly: Intl.DateTimeFormatOptions = {
  hour: "2-digit",
  minute: "2-digit",
}

/**
 * Shows a session instant in the center's IANA time zone, never the device's and never
 * a fixed offset (ADR-008). Locale and time zone are separate inputs on purpose.
 */
export function formatSessionTime(
  utc: string,
  timeZone: string,
  locale: string,
  options: Omit<Intl.DateTimeFormatOptions, "timeZone"> = timeOnly
): string {
  return new DateFormatter(locale, { ...options, timeZone }).format(
    new Date(utc)
  )
}
