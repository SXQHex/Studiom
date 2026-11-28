import { createLink, Navigate } from "@tanstack/react-router"
import type { ComponentProps } from "react"

import { LinkButton } from "@workspace/ui/components/button"
import { SidebarMenuButton } from "@workspace/ui/components/sidebar"

import type { PageAddress } from "./navigation"

type SidebarLinkProps = Omit<ComponentProps<typeof LinkButton>, "variant"> & {
  isActive?: boolean
  tooltip?: string
}

// TanStack Router's documented way to give a React Aria link typed routes and
// preloading on intent.
const SidebarLink = createLink(function SidebarAnchor({
  href = "",
  className,
  isActive = false,
  tooltip,
  size: _size,
  ...props
}: SidebarLinkProps) {
  return (
    <SidebarMenuButton
      {...props}
      href={href}
      isActive={isActive}
      {...(tooltip === undefined ? {} : { tooltip, tooltipAlways: true })}
      {...(className === undefined ? {} : { className })}
    />
  )
})

const ButtonLink = createLink(LinkButton)

interface PageLinkProps {
  address: PageAddress
  isActive: boolean
  children: React.ReactNode
  className?: string
}

/** A menu entry in the desktop sidebar. */
export function SidebarPageLink({
  address: { group, module, page },
  tooltip,
  ...props
}: PageLinkProps & { tooltip?: string }) {
  const shared = { preload: "intent" as const, ...props }
  const hint = tooltip === undefined ? {} : { tooltip }

  if (group === "me") {
    return (
      <SidebarLink to="/me/$module" params={{ module }} {...shared} {...hint} />
    )
  }
  if (group === "platform") {
    return (
      <SidebarLink
        to="/platform/$module/$page"
        params={{ module, page }}
        {...shared}
        {...hint}
      />
    )
  }
  return (
    <SidebarLink
      to="/studio/$group/$module/$page"
      params={{ group, module, page }}
      {...shared}
      {...hint}
    />
  )
}

/** A menu entry in the phone bars, drawn as a button. */
export function ButtonPageLink({
  address: { group, module, page },
  isActive,
  ...props
}: PageLinkProps) {
  const shared = {
    preload: "intent" as const,
    variant: isActive ? ("secondary" as const) : ("ghost" as const),
    ...props,
  }

  if (group === "me") {
    return <ButtonLink to="/me/$module" params={{ module }} {...shared} />
  }
  if (group === "platform") {
    return (
      <ButtonLink
        to="/platform/$module/$page"
        params={{ module, page }}
        {...shared}
      />
    )
  }
  return (
    <ButtonLink
      to="/studio/$group/$module/$page"
      params={{ group, module, page }}
      {...shared}
    />
  )
}

/** Replaces the current address with a page. */
export function RedirectToPage({
  address: { group, module, page },
}: {
  address: PageAddress
}) {
  if (group === "me") {
    return <Navigate to="/me/$module" params={{ module }} replace />
  }
  if (group === "platform") {
    return (
      <Navigate
        to="/platform/$module/$page"
        params={{ module, page }}
        replace
      />
    )
  }
  return (
    <Navigate
      to="/studio/$group/$module/$page"
      params={{ group, module, page }}
      replace
    />
  )
}
