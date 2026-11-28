import { createFileRoute } from "@tanstack/react-router"

import { lazyLoadShell } from "@/app-shell/lazy-load-shell"
import { StudioShell } from "@/app-shell/shell-routes"

export const Route = createFileRoute("/studio")({
  loader: ({ context }) => lazyLoadShell("studio", context.queryClient),
  component: StudioShell,
})
