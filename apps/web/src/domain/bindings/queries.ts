import { queryOptions } from "@tanstack/react-query"
import { sampleUsersList, sessionCurrent } from "@workspace/contracts/person"

import { callOperation } from "@/api/client"

/** The signed-in person and their bindings; null when nobody is signed in. */
export const currentSessionQuery = queryOptions({
  queryKey: ["session", "current"],
  queryFn: () => callOperation(sessionCurrent, {}),
})

/** Mock mode only: people to try the app as (ADR-007). */
export const sampleUsersQuery = queryOptions({
  queryKey: ["session", "sampleUsers"],
  queryFn: () => callOperation(sampleUsersList, {}),
})
