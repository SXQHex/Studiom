import type {
  Capabilities,
  LimitKey,
  PlanFeature,
} from "@workspace/contracts/plan"

/** Whether the organization's plan includes a feature. */
export function can(capabilities: Capabilities, feature: PlanFeature): boolean {
  return capabilities.plan.features.includes(feature)
}

export interface LimitState {
  key: LimitKey
  used: number
  /** null when the plan has no commercial quota for this key. */
  max: number | null
  /** Free slots left; null when unlimited. */
  remaining: number | null
  /** True when one more would go over the limit, so the limit dialog shows. */
  reached: boolean
}

/** Usage against one limit key. */
export function limit(capabilities: Capabilities, key: LimitKey): LimitState {
  const used = capabilities.usage[key]
  const planLimit = capabilities.plan.limits[key]
  if (planLimit.kind === "unlimited") {
    return { key, used, max: null, remaining: null, reached: false }
  }
  const remaining = Math.max(0, planLimit.max - used)
  return { key, used, max: planLimit.max, remaining, reached: remaining === 0 }
}
