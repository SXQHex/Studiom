import { createFileRoute } from "@tanstack/react-router"

import { lazyLoadShell } from "@/app-shell/lazy-load-shell"
import { MeShell } from "@/app-shell/shell-routes"

export const Route = createFileRoute("/me")({
  loader: ({ context }) => lazyLoadShell("me", context.queryClient),
  component: MeShell,
})
