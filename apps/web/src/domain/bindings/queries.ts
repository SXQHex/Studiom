import { queryOptions } from "@tanstack/react-query"
import { sessionCurrent } from "@workspace/contracts/person"

import { callOperation } from "@/api/client"

/** The signed-in person and their bindings; null when nobody is signed in. */
export const currentSessionQuery = queryOptions({
  queryKey: ["session", "current"],
  queryFn: () => callOperation(sessionCurrent, {}),
})
