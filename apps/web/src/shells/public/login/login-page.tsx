import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { signInAs } from "@workspace/contracts/person"
import { useTranslation } from "react-i18next"

import { Button } from "@workspace/ui/components/button"
import { LoadingState } from "@workspace/ui/components/loading-state"
import { StateView } from "@workspace/ui/components/state-view"

import { callOperation } from "@/api/client"
import { shellOf } from "@/app-shell/navigation"
import {
  lastUsedBinding,
  rememberBinding,
} from "@/domain/bindings/last-binding"
import {
  currentSessionQuery,
  sampleUsersQuery,
} from "@/domain/bindings/queries"

/** Mock mode: sign in as one of the sample people (ADR-007). The full screen is T14. */
export function LoginPage() {
  const { t } = useTranslation(["auth-login", "common"])
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const users = useQuery(sampleUsersQuery)
  const signIn = useMutation({
    mutationFn: (personId: string) => callOperation(signInAs, { personId }),
    onSuccess: async (session) => {
      // Nothing of the previous person may stay cached.
      queryClient.removeQueries()
      queryClient.setQueryData(currentSessionQuery.queryKey, session)
      const binding =
        lastUsedBinding(session.bindings) ?? session.bindings[0] ?? null
      if (!binding) return
      rememberBinding(binding)
      await navigate({ to: `/${shellOf(binding)}` })
    },
  })

  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">{t("title")}</h1>
      <p className="text-muted-foreground">{t("hint")}</p>
      {users.isPending ? (
        <LoadingState label={t("common:loading.label")} />
      ) : null}
      {users.isError ? (
        <StateView
          kind="error"
          title={t("common:error.dataTitle")}
          description={t("common:error.description")}
        >
          <Button onPress={() => void users.refetch()}>
            {t("common:error.retry")}
          </Button>
        </StateView>
      ) : null}
      {signIn.isError ? <p role="alert">{t("failed")}</p> : null}
      {users.data ? (
        <ul aria-label={t("sampleUsers")} className="flex flex-col gap-2">
          {users.data.items.map((user) => (
            <li key={user.personId}>
              <Button
                variant="outline"
                className="h-auto w-full flex-col items-start gap-0.5 py-2 text-start whitespace-normal"
                isDisabled={signIn.isPending}
                onPress={() => {
                  signIn.mutate(user.personId)
                }}
              >
                <span>{user.name}</span>
                <span className="text-xs text-muted-foreground">
                  {user.label}
                </span>
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </main>
  )
}
