import { createFileRoute } from "@tanstack/react-router"

import { StudioPage } from "@/app-shell/shell-routes"

export const Route = createFileRoute("/studio/$group/$module/$page")({
  component: StudioPage,
})
