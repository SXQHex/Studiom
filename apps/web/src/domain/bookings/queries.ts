import { mutationOptions, queryOptions } from "@tanstack/react-query"
import {
  attendanceApprove,
  attendanceSet,
  bookingsCancel,
  bookingsCreate,
  seriesJoin,
  seriesPreview,
} from "@workspace/contracts/schedule"
import type { z } from "zod"

import { callOperation } from "@/api/client"

/**
 * Booking actions. Each changes sessions, packages and profiles, so success
 * refreshes every query; refusals carry the rule on `ApiRequestError.reason`.
 */
export const bookMutation = mutationOptions({
  mutationFn: (input: z.input<typeof bookingsCreate.request>) =>
    callOperation(bookingsCreate, input),
  onSuccess: (_data, _input, _result, { client }) => client.invalidateQueries(),
})

/** Eligibility for a course and the full sessions to warn about. */
export function seriesPreviewQuery(
  input: z.input<typeof seriesPreview.request>
) {
  return queryOptions({
    queryKey: ["sessions", "series-preview", input],
    queryFn: () => callOperation(seriesPreview, input),
  })
}

export const joinSeriesMutation = mutationOptions({
  mutationFn: (input: z.input<typeof seriesJoin.request>) =>
    callOperation(seriesJoin, input),
  onSuccess: (_data, _input, _result, { client }) => client.invalidateQueries(),
})

export const cancelBookingMutation = mutationOptions({
  mutationFn: (input: z.input<typeof bookingsCancel.request>) =>
    callOperation(bookingsCancel, input),
  onSuccess: (_data, _input, _result, { client }) => client.invalidateQueries(),
})

export const attendanceMutation = mutationOptions({
  mutationFn: (input: z.input<typeof attendanceSet.request>) =>
    callOperation(attendanceSet, input),
  onSuccess: (_data, _input, _result, { client }) => client.invalidateQueries(),
})

/** The manager's sign-off of an ended session (ADR-021). */
export const approveAttendanceMutation = mutationOptions({
  mutationFn: (input: z.input<typeof attendanceApprove.request>) =>
    callOperation(attendanceApprove, input),
  onSuccess: (_data, _input, _result, { client }) => client.invalidateQueries(),
})
