import {
  CalendarDate,
  CalendarDateTime,
  fromDate,
  toCalendarDate,
  toZoned,
} from "@internationalized/date"

/** Today in the given time zone, so "today" follows the center, not the device (ADR-008). */
export function localToday(now: Date, timeZone: string): CalendarDate {
  return toCalendarDate(fromDate(now, timeZone))
}

/** UTC ISO string of a wall-clock time on a local date in the given time zone. */
export function localTimeToUtc(
  date: CalendarDate,
  time: string,
  timeZone: string
): string {
  const [hour = 0, minute = 0] = time.split(":").map(Number)
  const wallClock = new CalendarDateTime(
    date.year,
    date.month,
    date.day,
    hour,
    minute
  )
  return toZoned(wallClock, timeZone).toDate().toISOString()
}

/** Shifts a UTC instant by whole minutes. */
export function addMinutes(utc: string, minutes: number): string {
  return new Date(Date.parse(utc) + minutes * 60_000).toISOString()
}
