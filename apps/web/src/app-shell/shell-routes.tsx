import { getRouteApi } from "@tanstack/react-router"

import { moduleCatalog, type ModuleGroup } from "@/domain/capabilities/modules"

import { ShellLayout, ShellPage } from "./shell-layout"

const platform = getRouteApi("/platform")
const studio = getRouteApi("/studio")
const me = getRouteApi("/me")
const platformPage = getRouteApi("/platform/$module/$page")
const studioPage = getRouteApi("/studio/$group/$module/$page")
const mePage = getRouteApi("/me/$module")

export function PlatformShell() {
  return <ShellLayout shell="platform" data={platform.useLoaderData()} />
}

export function StudioShell() {
  return <ShellLayout shell="studio" data={studio.useLoaderData()} />
}

export function MeShell() {
  return <ShellLayout shell="me" data={me.useLoaderData()} />
}

export function PlatformPage() {
  const data = platform.useLoaderData()
  const { module, page } = platformPage.useParams()
  return <ShellPage data={data} address={{ group: "platform", module, page }} />
}

function isStudioGroup(group: string): group is ModuleGroup {
  return group === "center" || group === "organization"
}

export function StudioPage() {
  const data = studio.useLoaderData()
  const { group, module, page } = studioPage.useParams()
  // An unknown group reads like an unknown page.
  const address = isStudioGroup(group)
    ? { group, module, page }
    : { group: "center" as const, module: "", page: "" }
  return <ShellPage data={data} address={address} />
}

export function MePage() {
  const data = me.useLoaderData()
  const { module } = mePage.useParams()
  const known = moduleCatalog.me.some((m) => m.id === module)
  return (
    <ShellPage
      data={data}
      address={{ group: "me", module, page: known ? module : "" }}
    />
  )
}
