import { Outlet, useRouter } from "@tanstack/react-router"
import { I18nProvider, RouterProvider } from "react-aria-components"
import { useTranslation } from "react-i18next"

/**
 * Connects React Aria links to TanStack Router (React Aria's documented setup) and
 * gives React Aria the active i18next language for dates, numbers and mirroring.
 */
export function AppRoot() {
  const router = useRouter()
  const { i18n } = useTranslation()

  return (
    <I18nProvider locale={i18n.resolvedLanguage ?? i18n.language}>
      <RouterProvider
        navigate={(href) => {
          router.history.push(href)
        }}
        useHref={(href) => router.history.createHref(href)}
      >
        <Outlet />
      </RouterProvider>
    </I18nProvider>
  )
}
