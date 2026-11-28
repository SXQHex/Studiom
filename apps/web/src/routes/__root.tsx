import { createRootRoute, lazyRouteComponent } from "@tanstack/react-router"

import { AppRoot } from "@/app-root"

export const Route = createRootRoute({
  component: AppRoot,
  // Loaded on demand to keep it out of the initial bundle.
  notFoundComponent: lazyRouteComponent(
    () => import("@/shells/public/not-found/not-found-page"),
    "NotFoundPage"
  ),
})
