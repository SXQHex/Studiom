import { z } from "zod"

/** Opaque record identifier. Mock ids are readable (`org_pro`), real ones may be UUIDs. */
export const id = z.string().min(1)

/** An instant, always stored and sent in UTC (ADR-008). */
export const utcDateTime = z.iso.datetime()

/** A calendar date without a time zone, for validity and due dates. */
export const calendarDate = z.iso.date()

const timeZones = new Set(Intl.supportedValuesOf("timeZone"))

/** An IANA time zone name such as `Europe/Istanbul`. A fixed offset is never used (ADR-008). */
export const timeZone = z.string().refine((value) => timeZones.has(value), {
  message: "Expected an IANA time zone name",
})

export const locale = z.enum(["tr", "en"])
export type Locale = z.infer<typeof locale>

export const currency = z.enum(["TRY", "EUR"])
export type Currency = z.infer<typeof currency>

/** An amount in minor units (kuruş, cent), so sums stay exact. */
export const money = z.object({
  amountMinor: z.number().int(),
  currency,
})
export type Money = z.infer<typeof money>
