import { useParams } from "@tanstack/react-router"
import { UserRoundIcon } from "lucide-react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { LinkButton } from "@workspace/ui/components/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar"

import { moduleIcon } from "./module-icons"
import { useNavLabel } from "./nav-label"
import { ButtonPageLink, SidebarPageLink } from "./nav-link"
import type { NavModule, Shell } from "./navigation"
import { Notifications } from "./notifications"
import { ThemeMenu } from "./theme-menu"

/**
 * A phone bar scrolls sideways; the current entry must not stay out of sight.
 * Given only to the current entry, so it runs when the current entry changes.
 */
function showCurrent(entry: HTMLElement | null) {
  entry?.scrollIntoView({ block: "nearest", inline: "center" })
}

/** The sidebar component stores its state in this cookie. */
function sidebarOpen() {
  return !document.cookie.includes("sidebar_state=false")
}

const sidebarWidth: React.CSSProperties & Record<`--${string}`, string> = {
  "--sidebar-width": "19rem",
}

/**
 * The frame of the signed-in shells (ADR-002): on a desktop an icon rail of modules
 * and a panel of the module's pages; on a phone the modules in a bottom bar and the
 * pages in a row at the top.
 */
export function AppShell({
  shell,
  modules,
  subtitle,
  children,
}: {
  shell: Shell
  modules: readonly NavModule[]
  /** Whose data this is: the organization or the person. */
  subtitle: string
  children: ReactNode
}) {
  const { t } = useTranslation("shell")
  const label = useNavLabel()
  const params = useParams({ strict: false })
  const group = params.group ?? (shell === "studio" ? undefined : shell)
  const current = modules.find(
    (m) => m.group === group && m.id === params.module
  )
  const currentPage = params.page ?? params.module

  const shellName = t(shell)
  const rail = modules.map((m) => {
    const key = `${m.group}.${m.id}`
    return {
      key,
      name: label(key),
      Icon: moduleIcon(key),
      isActive: m === current,
      address: { group: m.group, module: m.id, page: m.pages[0] ?? m.id },
    }
  })
  const pages =
    current === undefined || current.pages.length < 2
      ? []
      : current.pages.map((page) => ({
          key: page,
          name: label(`${current.group}.${current.id}.${page}`),
          isActive: page === currentPage,
          address: { group: current.group, module: current.id, page },
        }))

  return (
    <SidebarProvider defaultOpen={sidebarOpen()} style={sidebarWidth}>
      <Sidebar
        collapsible="icon"
        className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
      >
        <Sidebar
          collapsible="none"
          className="w-[calc(var(--sidebar-width-icon)+1px)]! border-e"
        >
          <SidebarContent>
            <nav aria-label={t("modules")}>
              <SidebarGroup className="px-2">
                <SidebarMenu className="items-center">
                  {rail.map((item) => (
                    <SidebarMenuItem key={item.key}>
                      <SidebarPageLink
                        address={item.address}
                        isActive={item.isActive}
                        tooltip={item.name}
                        className="size-8 justify-center p-2!"
                      >
                        <item.Icon aria-hidden />
                        <span className="sr-only">{item.name}</span>
                      </SidebarPageLink>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            </nav>
          </SidebarContent>
          <SidebarFooter className="items-center">
            <SidebarMenuButton
              href="/auth/login"
              aria-label={t("switchUser")}
              className="size-8 justify-center p-2!"
            >
              <UserRoundIcon aria-hidden />
            </SidebarMenuButton>
          </SidebarFooter>
        </Sidebar>
        <Sidebar
          collapsible="none"
          className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"
        >
          <SidebarHeader className="border-b px-4 py-3">
            <span className="truncate text-sm font-semibold">
              {current ? label(`${current.group}.${current.id}`) : shellName}
            </span>
            <span className="truncate text-xs text-sidebar-foreground/70">
              {subtitle}
            </span>
          </SidebarHeader>
          <SidebarContent>
            <nav aria-label={t("pages")}>
              <SidebarGroup>
                <SidebarMenu>
                  {pages.map((item) => (
                    <SidebarMenuItem key={item.key}>
                      <SidebarPageLink
                        address={item.address}
                        isActive={item.isActive}
                      >
                        <span>{item.name}</span>
                      </SidebarPageLink>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            </nav>
          </SidebarContent>
        </Sidebar>
      </Sidebar>
      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <header
          data-shell={shell}
          className="flex h-12 items-center gap-2 border-b px-3 data-[shell=platform]:bg-foreground data-[shell=platform]:text-background"
        >
          <SidebarTrigger
            label={t("toggleSidebar")}
            className="hidden md:inline-flex"
          />
          <span className="truncate text-sm font-medium">{shellName}</span>
          <span className="truncate text-sm opacity-70 md:hidden">
            {subtitle}
          </span>
          <div className="ms-auto flex items-center gap-1">
            <ThemeMenu />
            <Notifications />
            <LinkButton
              href="/auth/login"
              variant="ghost"
              size="icon-sm"
              aria-label={t("switchUser")}
              className="md:hidden"
            >
              <UserRoundIcon aria-hidden />
            </LinkButton>
          </div>
        </header>
        {pages.length > 0 ? (
          <nav
            aria-label={t("pages")}
            className="flex gap-1 overflow-x-auto border-b p-2 md:hidden"
          >
            {pages.map((item) => (
              <div
                key={item.key}
                ref={item.isActive ? showCurrent : null}
                className="flex shrink-0"
              >
                <ButtonPageLink address={item.address} isActive={item.isActive}>
                  {item.name}
                </ButtonPageLink>
              </div>
            ))}
          </nav>
        ) : null}
        <SidebarInset>{children}</SidebarInset>
        <nav
          aria-label={t("modules")}
          className="fixed inset-x-0 bottom-0 z-20 flex gap-1 overflow-x-auto border-t bg-background p-2 md:hidden"
        >
          {rail.map((item) => (
            <div
              key={item.key}
              ref={item.isActive ? showCurrent : null}
              className="flex min-w-16 flex-1 shrink-0"
            >
              <ButtonPageLink
                address={item.address}
                isActive={item.isActive}
                className="h-auto w-full flex-col gap-1 py-1.5 text-xs"
              >
                <item.Icon aria-hidden />
                {item.name}
              </ButtonPageLink>
            </div>
          ))}
        </nav>
      </div>
    </SidebarProvider>
  )
}
