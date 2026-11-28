import { mutationOptions, queryOptions } from "@tanstack/react-query"
import {
  sessionsCancel,
  sessionsGet,
  sessionsList,
  sessionsUpdate,
} from "@workspace/contracts/schedule"
import type { z } from "zod"

import { callOperation } from "@/api/client"

type SessionFilter = z.input<typeof sessionsList.request>

/** Every session query starts with this key, so one invalidation refreshes them all. */
const sessionsKey = ["sessions"] as const

/** Sessions of a center, an instructor or a participant inside a time window. */
export function sessionsQuery(filter: SessionFilter) {
  return queryOptions({
    queryKey: [...sessionsKey, "list", filter],
    queryFn: () => callOperation(sessionsList, filter),
  })
}

/** One session with its counts, roster and what the signed-in person may do. */
export function sessionQuery(sessionId: string) {
  return queryOptions({
    queryKey: [...sessionsKey, "detail", sessionId],
    queryFn: () => callOperation(sessionsGet, { sessionId }),
  })
}

export const updateSessionsMutation = mutationOptions({
  mutationFn: (input: z.input<typeof sessionsUpdate.request>) =>
    callOperation(sessionsUpdate, input),
  // Cancelling and moving also change bookings and packages.
  onSuccess: (_data, _input, _result, { client }) => client.invalidateQueries(),
})

export const cancelSessionsMutation = mutationOptions({
  mutationFn: (input: z.input<typeof sessionsCancel.request>) =>
    callOperation(sessionsCancel, input),
  onSuccess: (_data, _input, _result, { client }) => client.invalidateQueries(),
})
