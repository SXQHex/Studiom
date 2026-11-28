import { peopleInvite } from "@workspace/contracts/profile"

/** The invitation form: the request without the center, which the page knows. */
export const inviteForm = peopleInvite.request.omit({ centerId: true })
