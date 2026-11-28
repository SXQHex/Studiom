import { useRouter, type ErrorComponentProps } from "@tanstack/react-router"
import { useTranslation } from "react-i18next"

import { Button } from "@workspace/ui/components/button"
import { StateView } from "@workspace/ui/components/state-view"

export function RouteError({ reset }: ErrorComponentProps) {
  const router = useRouter()
  const { t } = useTranslation()

  return (
    <main className="flex min-h-svh flex-col">
      <StateView
        kind="error"
        headingLevel={1}
        title={t("error.pageTitle")}
        description={t("error.description")}
      >
        <Button
          onPress={() => {
            reset()
            void router.invalidate()
          }}
        >
          {t("error.retry")}
        </Button>
      </StateView>
    </main>
  )
}
