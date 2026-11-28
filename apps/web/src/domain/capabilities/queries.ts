import { queryOptions } from "@tanstack/react-query"
import { capabilitiesGet } from "@workspace/contracts/plan"

import { callOperation } from "@/api/client"

/** Plan and usage of one organization: the single capability registry (ADR-010). */
export function capabilitiesQuery(organizationId: string) {
  return queryOptions({
    queryKey: ["capabilities", organizationId],
    queryFn: () => callOperation(capabilitiesGet, { organizationId }),
  })
}
