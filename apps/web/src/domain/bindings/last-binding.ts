import type { Binding } from "@workspace/contracts/person"

const key = "studiom.lastBindingId"

/** The binding the person worked in last, if it is still one of theirs (ADR-001). */
export function lastUsedBinding(bindings: readonly Binding[]): Binding | null {
  let id: string | null = null
  try {
    id = localStorage.getItem(key)
  } catch {
    // Storage can be blocked; the first binding is a fine default then.
  }
  return bindings.find((b) => b.id === id) ?? null
}

export function rememberBinding(binding: Binding) {
  try {
    localStorage.setItem(key, binding.id)
  } catch {
    // Not remembering only costs one extra click next time.
  }
}
