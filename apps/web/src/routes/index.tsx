import { createFileRoute } from "@tanstack/react-router"

import { HomePage } from "@/shells/public/home/home-page"

export const Route = createFileRoute("/")({ component: HomePage })
