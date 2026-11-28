import { queryOptions } from "@tanstack/react-query"
import {
  centersList,
  organizationsList,
} from "@workspace/contracts/organization"

import { callOperation } from "@/api/client"

export const organizationsQuery = queryOptions({
  queryKey: ["organizations"],
  queryFn: () => callOperation(organizationsList, {}),
})

export function centersQuery(organizationId: string) {
  return queryOptions({
    queryKey: ["centers", organizationId],
    queryFn: () => callOperation(centersList, { organizationId }),
  })
}
