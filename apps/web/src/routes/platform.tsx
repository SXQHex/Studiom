import { createFileRoute } from "@tanstack/react-router"

import { lazyLoadShell } from "@/app-shell/lazy-load-shell"
import { PlatformShell } from "@/app-shell/shell-routes"

export const Route = createFileRoute("/platform")({
  loader: ({ context }) => lazyLoadShell("platform", context.queryClient),
  component: PlatformShell,
})
