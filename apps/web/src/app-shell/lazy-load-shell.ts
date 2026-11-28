import type { QueryClient } from "@tanstack/react-query"

import type { Shell } from "./navigation"

/**
 * A route loader is part of the initial bundle; this keeps the data code a shell
 * needs (schemas, queries) out of it.
 */
export async function lazyLoadShell(shell: Shell, queryClient: QueryClient) {
  const { loadShell } = await import("./load-shell")
  return loadShell(shell, queryClient)
}
