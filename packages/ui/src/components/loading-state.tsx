import { cn } from "cn"

import { Skeleton } from "@workspace/ui/components/skeleton"

/** Skeleton lines while a list or card loads. */
function LoadingState({
  label,
  delayed = true,
}: {
  /** Translated text for screen readers. */
  label: string
  /** Stays invisible for 400 ms, so short loads do not flash. */
  delayed?: boolean
}) {
  return (
    <div
      data-slot="loading-state"
      className={cn(
        "flex w-full flex-col gap-3 p-5",
        delayed && "animate-in delay-400 fade-in-0 fill-mode-backwards"
      )}
    >
      <output className="sr-only">{label}</output>
      <Skeleton className="h-4 w-2/5" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <Skeleton className="h-4 w-3/5" />
    </div>
  )
}

export { LoadingState }
