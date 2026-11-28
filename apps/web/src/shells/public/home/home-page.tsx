import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { Button } from "@workspace/ui/components/button"
import { LoadingState } from "@workspace/ui/components/loading-state"
import { StateView } from "@workspace/ui/components/state-view"

import { systemHealthQuery } from "@/api/system"

export function HomePage() {
  const { t } = useTranslation()
  const health = useQuery(systemHealthQuery)

  return (
    <main className="flex min-h-svh flex-col items-start gap-2 p-6">
      <h1 className="text-2xl font-semibold">Studiom</h1>
      <p>{t("home.underConstruction")}</p>
      {health.isPending ? <LoadingState label={t("loading.label")} /> : null}
      {health.isError ? (
        <StateView
          kind="error"
          title={t("error.dataTitle")}
          description={t("error.description")}
        >
          <Button onPress={() => void health.refetch()}>
            {t("error.retry")}
          </Button>
        </StateView>
      ) : null}
      {health.data ? (
        <p className="text-muted-foreground">{t("home.apiReady")}</p>
      ) : null}
    </main>
  )
}
