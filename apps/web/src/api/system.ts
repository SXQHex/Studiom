import { queryOptions } from "@tanstack/react-query"
import { systemHealth } from "@workspace/contracts/system"

export const systemHealthQuery = queryOptions({
  queryKey: ["system", "health"],
  queryFn: async () => {
    const response = await fetch(systemHealth.path, { method: "POST" })
    if (!response.ok) throw new Error(`health: ${response.status}`)
    return systemHealth.response.parse(await response.json())
  },
})
