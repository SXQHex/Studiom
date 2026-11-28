import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"

import { systemHealthQuery } from "@/api/system"

export function HomePage() {
  const { t } = useTranslation()
  const health = useQuery(systemHealthQuery)

  return (
    <main className="flex min-h-svh flex-col items-start gap-2 p-6">
      <h1 className="text-2xl font-semibold">Studiom</h1>
      <p>{t("home.underConstruction")}</p>
      {health.data ? (
        <p className="text-muted-foreground">{t("home.apiReady")}</p>
      ) : null}
    </main>
  )
}
