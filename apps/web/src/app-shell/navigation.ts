import type { Binding } from "@workspace/contracts/person"

import { lastUsedBinding } from "@/domain/bindings/last-binding"
import {
  pageAccess,
  visibleModules,
  type ModuleContext,
  type ModuleGroup,
  type PageAccess,
  type VisibleModule,
} from "@/domain/capabilities/modules"

/** The three signed-in shells (ADR-001). */
export type Shell = "platform" | "studio" | "me"

const shellOfScope = {
  platform: "platform",
  organization: "studio",
  center: "studio",
  instructor: "me",
  member: "me",
} as const satisfies Record<Binding["scope"], Shell>

export function shellOf(binding: Binding): Shell {
  return shellOfScope[binding.scope]
}

/** The bindings one shell works with: the active one first, then its companions. */
export interface ShellBindings {
  active: Binding
  /** In the Studio shell, one binding per group of the active organization. */
  groups: Partial<Record<ModuleGroup, Binding>>
}

/**
 * Picks the bindings of a shell: the one used last if it belongs there, else the
 * first. Studio is one tenant (ADR-001), so both groups come from the same
 * organization. Null when the person has no binding for the shell.
 */
export function shellBindings(
  shell: Shell,
  bindings: readonly Binding[],
  last: Binding | null = lastUsedBinding(bindings)
): ShellBindings | null {
  const own = bindings.filter(
    (b) => b.status === "active" && shellOf(b) === shell
  )
  const active = own.find((b) => b.id === last?.id) ?? own[0]
  if (!active) return null
  if (shell !== "studio") {
    return { active, groups: { [shell]: active } }
  }
  const organizationId =
    "organizationId" in active ? active.organizationId : undefined
  const inTenant = [active, ...own].filter(
    (b) => "organizationId" in b && b.organizationId === organizationId
  )
  const groups: ShellBindings["groups"] = {}
  const center = inTenant.find((b) => b.scope === "center")
  const organization = inTenant.find((b) => b.scope === "organization")
  if (center) groups.center = center
  if (organization) groups.organization = organization
  return { active, groups }
}

export interface NavModule extends VisibleModule {
  group: ModuleGroup
}

const groupOrder: readonly ModuleGroup[] = [
  "platform",
  "center",
  "organization",
  "me",
]

/** Every module the shell's bindings open, in menu order. */
export function shellModules(
  selection: ShellBindings,
  context: ModuleContext
): NavModule[] {
  return groupOrder.flatMap((group) => {
    const binding = selection.groups[group]
    if (!binding) return []
    return visibleModules(binding, context).map(({ id, pages }) => ({
      id,
      pages,
      group,
    }))
  })
}

export interface PageAddress {
  group: ModuleGroup
  module: string
  page: string
}

export function shellPageAccess(
  selection: ShellBindings,
  context: ModuleContext,
  address: PageAddress
): PageAccess {
  const binding = selection.groups[address.group]
  if (!binding) {
    // The group is not this person's; unknown addresses still read as unknown.
    const outsider = pageAccess(selection.active, context, address)
    return outsider === "unknown" ? "unknown" : "forbidden"
  }
  return pageAccess(binding, context, address)
}
