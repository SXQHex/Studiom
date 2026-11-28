import { Outlet, useParams } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { LinkButton } from "@workspace/ui/components/button"
import { StateView } from "@workspace/ui/components/state-view"

import { AppShell } from "./app-shell"
import type { ShellData } from "./load-shell"
import { useNavLabel } from "./nav-label"
import { RedirectToPage } from "./nav-link"
import {
  shellModules,
  shellPageAccess,
  type PageAddress,
  type Shell,
} from "./navigation"

/** One shell: its menus around the current page, or the reason it stays closed. */
export function ShellLayout({
  shell,
  data: { selection, context, subtitle },
}: {
  shell: Shell
  data: ShellData
}) {
  const { t } = useTranslation("shell")
  const params = useParams({ strict: false })

  if (!selection) {
    return (
      <main className="flex min-h-svh flex-col">
        <StateView
          kind="forbidden"
          headingLevel={1}
          title={t("noShellTitle")}
          description={t("noShellText")}
        >
          <LinkButton href="/auth/login">{t("switchUser")}</LinkButton>
        </StateView>
      </main>
    )
  }

  const modules = shellModules(selection, context)
  const first = modules[0]
  // The shell's own address opens its first page.
  if (params.module === undefined && first) {
    return (
      <RedirectToPage
        address={{
          group: first.group,
          module: first.id,
          page: first.pages[0] ?? first.id,
        }}
      />
    )
  }

  return (
    <AppShell shell={shell} modules={modules} subtitle={subtitle}>
      <Outlet />
    </AppShell>
  )
}

/** A page of a shell that is not drawn yet, or why this address does not open. */
export function ShellPage({
  data: { selection, context },
  address,
}: {
  data: ShellData
  address: PageAddress
}) {
  const { t } = useTranslation(["shell", "common"])
  const label = useNavLabel()
  if (!selection) return null

  const access = shellPageAccess(selection, context, address)
  const page = label(`${address.group}.${address.module}.${address.page}`)

  if (access === "open") {
    return (
      <div className="flex flex-1 flex-col p-4 md:p-6">
        <h1 className="text-2xl font-semibold">{page}</h1>
        <StateView kind="empty" title={t("notDrawn")} />
      </div>
    )
  }
  if (access === "unknown") {
    return (
      <StateView
        kind="notFound"
        headingLevel={1}
        title={t("common:notFound.title")}
        description={t("common:notFound.description")}
      />
    )
  }
  return access === "outOfPlan" ? (
    <StateView
      kind="outOfPlan"
      headingLevel={1}
      title={t("planTitle", { page })}
      description={t("planText")}
    />
  ) : (
    <StateView
      kind="forbidden"
      headingLevel={1}
      title={t("forbiddenTitle")}
      description={t("forbiddenText")}
    />
  )
}
