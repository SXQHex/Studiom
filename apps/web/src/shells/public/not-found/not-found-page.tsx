import { useTranslation } from "react-i18next"

import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { LinkButton } from "@workspace/ui/components/button"

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <main className="flex min-h-svh flex-col">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>
            <h1>{t("notFound.title")}</h1>
          </EmptyTitle>
        </EmptyHeader>
        <EmptyContent>
          <LinkButton href="/">{t("notFound.backHome")}</LinkButton>
        </EmptyContent>
      </Empty>
    </main>
  )
}
