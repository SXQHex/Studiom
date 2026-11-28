import { createFileRoute } from "@tanstack/react-router"

import { PlatformPage } from "@/app-shell/shell-routes"

export const Route = createFileRoute("/platform/$module/$page")({
  component: PlatformPage,
})
