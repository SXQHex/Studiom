import { SunMoonIcon } from "lucide-react"
import { useTheme } from "next-themes"
import { useTranslation } from "react-i18next"

import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"

import { useHighContrast } from "./use-high-contrast"

export function ThemeMenu() {
  const { t } = useTranslation("shell")
  const { theme = "system", setTheme } = useTheme()
  const [highContrast, setHighContrast] = useHighContrast()

  return (
    <DropdownMenuTrigger>
      <Button variant="ghost" size="icon-sm" aria-label={t("theme")}>
        <SunMoonIcon aria-hidden />
      </Button>
      <DropdownMenu
        aria-label={t("theme")}
        placement="bottom end"
        className="min-w-48"
      >
        <DropdownMenuGroup
          aria-label={t("theme")}
          selectionMode="single"
          disallowEmptySelection
          selectedKeys={[theme]}
          onSelectionChange={(keys) => {
            if (keys === "all") return
            for (const key of keys) setTheme(String(key))
          }}
        >
          <DropdownMenuItem id="light">{t("themeLight")}</DropdownMenuItem>
          <DropdownMenuItem id="dark">{t("themeDark")}</DropdownMenuItem>
          <DropdownMenuItem id="system">{t("themeSystem")}</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup
          aria-label={t("highContrast")}
          selectionMode="multiple"
          selectedKeys={highContrast ? ["contrast"] : []}
          onSelectionChange={(keys) => {
            setHighContrast(keys === "all" || keys.has("contrast"))
          }}
        >
          <DropdownMenuItem id="contrast">{t("highContrast")}</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}
