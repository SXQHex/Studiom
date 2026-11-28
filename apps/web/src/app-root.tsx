import {
  Outlet,
  useRouter,
  type NavigateOptions,
  type ToOptions,
} from "@tanstack/react-router"
import { RouterProvider } from "react-aria-components"

declare module "react-aria-components" {
  interface RouterConfig {
    href: NonNullable<ToOptions["to"]>
    routerOptions: Omit<NavigateOptions, keyof ToOptions>
  }
}

/** Connects React Aria links to TanStack Router (React Aria's documented setup). */
export function AppRoot() {
  const router = useRouter()

  return (
    <RouterProvider
      navigate={(to, options) => {
        void router.navigate({ to, ...options })
      }}
      useHref={(to) => router.buildLocation({ to }).href}
    >
      <Outlet />
    </RouterProvider>
  )
}
