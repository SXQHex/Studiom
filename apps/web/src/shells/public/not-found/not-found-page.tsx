import { useTranslation } from "react-i18next"

import { LinkButton } from "@workspace/ui/components/button"
import { StateView } from "@workspace/ui/components/state-view"

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <main className="flex min-h-svh flex-col">
      <StateView
        kind="notFound"
        headingLevel={1}
        title={t("notFound.title")}
        description={t("notFound.description")}
      >
        <LinkButton href="/">{t("notFound.backHome")}</LinkButton>
      </StateView>
    </main>
  )
}
