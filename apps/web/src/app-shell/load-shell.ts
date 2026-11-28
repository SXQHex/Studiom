import type { QueryClient } from "@tanstack/react-query"
import { redirect } from "@tanstack/react-router"

import { currentSessionQuery } from "@/domain/bindings/queries"
import type { ModuleContext } from "@/domain/capabilities/modules"
import { capabilitiesQuery } from "@/domain/capabilities/queries"
import {
  centersQuery,
  organizationsQuery,
} from "@/domain/organizations/queries"

import { shellBindings, type Shell } from "./navigation"

/** What a shell needs before it can draw its menus. */
export async function loadShell(shell: Shell, queryClient: QueryClient) {
  const session = await queryClient.ensureQueryData(currentSessionQuery)
  if (!session) {
    // TanStack Router's redirect is thrown, not returned.
    throw redirect({ to: "/auth/login" })
  }
  const { person, bindings } = session
  const selection = shellBindings(shell, bindings)
  const personName = `${person.firstName} ${person.lastName}`
  const context: ModuleContext = { bindings }
  const tenant =
    shell === "studio" &&
    selection !== null &&
    "organizationId" in selection.active
      ? selection.active.organizationId
      : null
  if (tenant === null) return { selection, context, subtitle: personName }

  const [capabilities, centers, organizations] = await Promise.all([
    queryClient.ensureQueryData(capabilitiesQuery(tenant)),
    // Only refinements: without them the menus still work.
    queryClient.ensureQueryData(centersQuery(tenant)).catch(() => null),
    queryClient.ensureQueryData(organizationsQuery).catch(() => null),
  ])
  context.capabilities = capabilities
  if (centers) {
    context.centerCount = centers.items.filter(
      (c) => c.status === "active"
    ).length
  }
  const organization = organizations?.items.find((o) => o.id === tenant)
  return { selection, context, subtitle: organization?.name ?? personName }
}

export type ShellData = Awaited<ReturnType<typeof loadShell>>
