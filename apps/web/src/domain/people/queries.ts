import {
  keepPreviousData,
  mutationOptions,
  queryOptions,
} from "@tanstack/react-query"
import { peopleList } from "@workspace/contracts/person"
import {
  peopleInvite,
  peopleInviteResend,
  peopleProfile,
} from "@workspace/contracts/profile"
import type { z } from "zod"

import { callOperation } from "@/api/client"

type PeopleFilter = z.input<typeof peopleList.request>

/** One page of a search; the previous page stays visible while the next loads. */
export function peopleQuery(filter: PeopleFilter) {
  return queryOptions({
    queryKey: ["people", "list", filter],
    queryFn: () => callOperation(peopleList, filter),
    placeholderData: keepPreviousData,
  })
}

/** One person inside one organization, as far as the viewer may see. */
export function profileQuery(organizationId: string, personId: string) {
  return queryOptions({
    queryKey: ["people", "profile", organizationId, personId],
    queryFn: () => callOperation(peopleProfile, { organizationId, personId }),
  })
}

export const inviteMutation = mutationOptions({
  mutationFn: (input: z.input<typeof peopleInvite.request>) =>
    callOperation(peopleInvite, input),
  // The list and the plan usage change.
  onSuccess: (_data, _input, _result, { client }) => client.invalidateQueries(),
})

export const resendInviteMutation = mutationOptions({
  mutationFn: (input: z.input<typeof peopleInviteResend.request>) =>
    callOperation(peopleInviteResend, input),
})
