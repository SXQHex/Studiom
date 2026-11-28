import { useTranslation } from "react-i18next"

import { LoadingState } from "@workspace/ui/components/loading-state"

export function RoutePending() {
  const { t } = useTranslation()

  // The router already waits before showing this, so no second delay.
  return <LoadingState label={t("loading.label")} delayed={false} />
}
