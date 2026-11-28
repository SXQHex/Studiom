import type { QueryClient } from "@tanstack/react-query"
import {
  createRootRouteWithContext,
  lazyRouteComponent,
} from "@tanstack/react-router"

import { AppRoot } from "@/app-root"

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: AppRoot,
  // Loaded on demand to keep it out of the initial bundle.
  notFoundComponent: lazyRouteComponent(
    () => import("@/shells/public/not-found/not-found-page"),
    "NotFoundPage"
  ),
})
