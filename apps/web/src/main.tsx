import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  createRouter,
  lazyRouteComponent,
  RouterProvider,
} from "@tanstack/react-router"
import { ThemeProvider } from "next-themes"
import { I18nextProvider } from "react-i18next"

import { restoreContrast } from "@/app-shell/use-high-contrast"
import { i18n, i18nReady } from "@/i18n"
import { routeTree } from "@/routeTree.gen"
import { RoutePending } from "@/states/route-pending"

// Outside the initial bundle, but fetched at start so it is there when needed.
const RouteError = lazyRouteComponent(
  () => import("@/states/route-error"),
  "RouteError"
)

const queryClient = new QueryClient()

const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  defaultErrorComponent: RouteError,
  defaultPendingComponent: RoutePending,
  // Short loads keep the previous page instead of flashing a skeleton.
  defaultPendingMs: 400,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

async function start(container: HTMLElement) {
  // No backend yet: every request is answered by the mock worker (ADR-007).
  // Loaded as its own chunk, so removing the mocks later leaves the app bundle as is.
  const { startMockWorker } = await import("@workspace/mocks/browser")
  await Promise.all([startMockWorker(), i18nReady])
  void RouteError.preload?.()
  restoreContrast()
  createRoot(container).render(
    <StrictMode>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <I18nextProvider i18n={i18n}>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </I18nextProvider>
      </ThemeProvider>
    </StrictMode>
  )
}

const root = document.getElementById("root")
if (!root) throw new Error("Root element #root not found")
await start(root)
