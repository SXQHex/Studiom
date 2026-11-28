import { z } from "zod"

import { defineOperation, noInput } from "./operation"

export const systemHealth = defineOperation("system_health_v1", {
  request: noInput,
  response: z.object({ status: z.literal("ok") }),
})
