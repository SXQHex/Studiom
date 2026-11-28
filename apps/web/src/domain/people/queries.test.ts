import { MutationObserver, QueryClient } from "@tanstack/react-query"
import { createMockServer } from "@workspace/mocks/node"
import { afterAll, beforeAll, expect, test } from "vitest"

import { inviteForm } from "./forms"
import {
  inviteMutation,
  peopleQuery,
  profileQuery,
  resendInviteMutation,
} from "./queries"

const mock = await createMockServer()
beforeAll(() => {
  mock.server.listen({ onUnhandledFrame: "error" })
  mock.signIn("per_mert")
})
afterAll(() => mock.server.close())

const client = new QueryClient()

test("search, invite, filter and open the profile", async () => {
  const form = inviteForm.parse({
    firstName: "Derya",
    lastName: "Uslu",
    email: "derya.uslu@example.com",
  })
  const invite = new MutationObserver(client, inviteMutation)
  const { person } = await invite.mutate({
    ...form,
    centerId: "ctr_pro_kadikoy",
  })
  const found = await client.fetchQuery(
    peopleQuery({
      organizationId: "org_pro",
      query: "derya uslu",
      accountStatus: "invited",
    })
  )
  expect(found.items.map((p) => p.id)).toEqual([person.id])
  const profile = await client.fetchQuery(profileQuery("org_pro", person.id))
  expect(profile.bindings.map((b) => b.status)).toEqual(["invited"])
  const resend = new MutationObserver(client, resendInviteMutation)
  const again = await resend.mutate({
    organizationId: "org_pro",
    personId: person.id,
  })
  expect(again.person.email).toBe("derya.uslu@example.com")
})
