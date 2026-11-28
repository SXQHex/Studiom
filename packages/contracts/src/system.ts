import { z } from "zod"

/** Operations follow the Edge Function style: POST /functions/v1/api/<operation> (ADR-018). */
export const systemHealth = {
  path: "/functions/v1/api/system_health_v1",
  response: z.object({ status: z.literal("ok") }),
} as const
