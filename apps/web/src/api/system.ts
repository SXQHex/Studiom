import { queryOptions } from "@tanstack/react-query"
import { systemHealth } from "@workspace/contracts/system"

import { callOperation } from "@/api/client"

export const systemHealthQuery = queryOptions({
  queryKey: ["system", "health"],
  queryFn: () => callOperation(systemHealth, {}),
})
