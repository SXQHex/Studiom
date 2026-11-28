import { createFileRoute } from "@tanstack/react-router"

import { MePage } from "@/app-shell/shell-routes"

export const Route = createFileRoute("/me/$module")({ component: MePage })
