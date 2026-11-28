import { BellIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@workspace/ui/components/button"
import {
  Sheet,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@workspace/ui/components/sheet"
import { StateView } from "@workspace/ui/components/state-view"

/** The bell every shell shares. The list arrives with the first notification data. */
export function Notifications() {
  const { t } = useTranslation("shell")

  return (
    <SheetTrigger>
      <Button variant="ghost" size="icon-sm" aria-label={t("notifications")}>
        <BellIcon aria-hidden />
      </Button>
      <Sheet closeLabel={t("close")}>
        <SheetHeader>
          <SheetTitle>{t("notifications")}</SheetTitle>
        </SheetHeader>
        <StateView kind="empty" title={t("noNotifications")} />
      </Sheet>
    </SheetTrigger>
  )
}
