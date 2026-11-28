import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { createRouter, RouterProvider } from "@tanstack/react-router"
import { ThemeProvider } from "next-themes"
import { I18nextProvider } from "react-i18next"

import { i18n, i18nReady } from "@/i18n"
import { routeTree } from "@/routeTree.gen"

const router = createRouter({ routeTree, defaultPreload: "intent" })

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}

const queryClient = new QueryClient()

async function start(container: HTMLElement) {
  // No backend yet: every request is answered by the mock worker (ADR-007).
  // Loaded as its own chunk, so removing the mocks later leaves the app bundle as is.
  const { worker } = await import("@workspace/mocks/browser")
  await Promise.all([
    worker.start({ onUnhandledFrame: "bypass", quiet: true }),
    i18nReady,
  ])
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
