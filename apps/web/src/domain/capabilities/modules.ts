import type { Binding } from "@workspace/contracts/person"
import type { Capabilities, PlanFeature } from "@workspace/contracts/plan"

import { can } from "./capabilities"

/**
 * The accepted menus (ADR-002). A module is the unit of permission; a page only
 * names the plan feature it needs, because plan-less pages are hidden, not locked.
 */
interface PageDef {
  readonly id: string
  readonly feature?: PlanFeature
}

interface ModuleDef {
  readonly id: string
  readonly pages: readonly PageDef[]
}

const pages = (...ids: string[]): PageDef[] => ids.map((id) => ({ id }))

const centerModules = [
  { id: "today", pages: pages("today") },
  {
    id: "program",
    pages: [
      { id: "calendar" },
      { id: "events", feature: "events" },
      { id: "privateRequests" },
      { id: "waitlists", feature: "waitlist" },
    ],
  },
  { id: "people", pages: pages("members", "leads", "applications", "inbox") },
  {
    id: "sales",
    pages: [
      { id: "packagePrices" },
      { id: "sales" },
      { id: "debts" },
      { id: "payroll", feature: "payroll" },
      { id: "settlement", feature: "settlement" },
    ],
  },
  {
    id: "center",
    pages: pages("team", "rooms", "closures", "reports", "audit", "settings"),
  },
] as const satisfies readonly ModuleDef[]

const organizationModules = [
  {
    id: "definitions",
    pages: [
      { id: "disciplines" },
      { id: "packages" },
      { id: "workSchedule" },
      { id: "templates" },
      { id: "documents" },
      { id: "policies" },
      { id: "automation", feature: "automation" },
    ],
  },
  {
    id: "oversight",
    pages: pages(
      "exceptions",
      "people",
      "calendar",
      "bookings",
      "finance",
      "reports",
      "audit"
    ),
  },
  {
    id: "organization",
    pages: pages(
      "overview",
      "profile",
      "centers",
      "team",
      "security",
      "billing",
      "ownership"
    ),
  },
] as const satisfies readonly ModuleDef[]

const platformModules = [
  { id: "overview", pages: pages("overview") },
  { id: "tenants", pages: pages("organizations", "trials", "suspended") },
  { id: "subscription", pages: pages("plans", "subscriptions", "invoices") },
  {
    id: "support",
    pages: pages("tickets", "supportSessions", "announcements"),
  },
  { id: "system", pages: pages("team", "audit", "settings") },
] as const satisfies readonly ModuleDef[]

const meModules = [
  { id: "home", pages: pages("home") },
  { id: "program", pages: pages("program") },
  { id: "requests", pages: pages("requests") },
  { id: "wallet", pages: pages("wallet") },
  { id: "account", pages: pages("account") },
] as const satisfies readonly ModuleDef[]

export interface VisibleModule {
  id: string
  pages: string[]
}

export interface ModuleContext {
  /** Plan of the binding's organization; not needed for a platform binding. */
  capabilities?: Capabilities
  /** Every active binding of the person, for rules that look across bindings. */
  bindings: readonly Binding[]
  /** Active centers of the binding's organization. */
  centerCount?: number
}

function resolve(
  modules: readonly ModuleDef[],
  capabilities: Capabilities | undefined,
  keep: (id: string) => boolean = () => true
): VisibleModule[] {
  return modules
    .filter((m) => keep(m.id))
    .map((m) => ({
      id: m.id,
      pages: m.pages
        .filter(
          (p) =>
            p.feature === undefined ||
            (capabilities !== undefined && can(capabilities, p.feature))
        )
        .map((p) => p.id),
    }))
}

/**
 * Modules and pages one binding opens, derived from bindings × capabilities (ADR-010).
 * Platform → Platform shell; organization → Studio's organization group;
 * center → Studio's center group; instructor and member → the Ben shell.
 */
export function visibleModules(
  binding: Binding,
  context: ModuleContext
): VisibleModule[] {
  const { capabilities, bindings } = context
  switch (binding.scope) {
    case "platform":
      return resolve(platformModules, undefined)
    case "organization": {
      // In a one-center organization, oversight is hidden from someone who also
      // runs that center: they already see the same data with write access (ADR-002).
      const runsACenter = bindings.some(
        (b) =>
          b.scope === "center" && b.organizationId === binding.organizationId
      )
      const hideOversight = context.centerCount === 1 && runsACenter
      return resolve(
        organizationModules,
        capabilities,
        (id) => id !== "oversight" || !hideOversight
      )
    }
    case "center": {
      // Staff see the modules their manager opened, plus the Today board (ADR-003).
      const allowed = new Set<string>(binding.modules)
      return resolve(
        centerModules,
        capabilities,
        (id) =>
          binding.role === "center_manager" || id === "today" || allowed.has(id)
      )
    }
    default: {
      // Instructor and member bindings open the Ben shell.
      // "Talepler" is only for instructors (ADR-002).
      const teaches = bindings.some((b) => b.scope === "instructor")
      return resolve(
        meModules,
        capabilities,
        (id) => id !== "requests" || teaches
      )
    }
  }
}
