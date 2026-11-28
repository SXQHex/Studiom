import { Ban, CircleAlert, Inbox, Lock, SearchX, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { Skeleton } from "../components/skeleton";

/**
 * Shared state screens (T07). The package knows no i18n and no routing: every string
 * and every action is passed in, so apps/web feeds them from i18next and the router.
 */

export interface StateViewProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  /** Technical reference such as an operation id, shown in a code element. */
  code?: string;
  actions?: ReactNode;
  /** Heading level of the title; pages pick it so the outline stays valid. Default 2. */
  headingLevel?: 2 | 3 | 4;
  /** "alert" interrupts assistive tech and is reserved for failures. */
  tone?: "neutral" | "error";
  className?: string;
}

export function StateView({
  icon: Icon,
  title,
  description,
  code,
  actions,
  headingLevel = 2,
  tone = "neutral",
  className,
}: StateViewProps) {
  const Heading = `h${headingLevel}` as const;
  const Wrapper = tone === "error" ? "div" : "output";
  return (
    <Wrapper
      {...(tone === "error" ? { role: "alert" } : {})}
      className={cn(
        "mx-auto flex max-w-md flex-col items-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "grid size-10 place-items-center rounded-full bg-muted text-muted-foreground",
          tone === "error" && "bg-destructive/10 text-destructive",
        )}
      >
        <Icon className="size-5" />
      </span>
      <Heading className="text-base font-semibold">{title}</Heading>
      {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      {code ? <code className="rounded-sm bg-muted px-2 py-0.5 text-xs">{code}</code> : null}
      {actions ? <div className="mt-1 flex flex-wrap justify-center gap-2">{actions}</div> : null}
    </Wrapper>
  );
}

type Preset = Omit<StateViewProps, "icon" | "tone">;

export function EmptyState({ filtered = false, ...props }: Preset & { filtered?: boolean }) {
  return <StateView icon={filtered ? SearchX : Inbox} {...props} />;
}

export function ErrorState(props: Preset) {
  return <StateView icon={CircleAlert} tone="error" {...props} />;
}

export function ForbiddenState(props: Preset) {
  return <StateView icon={Lock} {...props} />;
}

/** The feature exists but the current plan does not include it. Actions carry the upgrade path. */
export function OutOfPlanState(props: Preset) {
  return <StateView icon={Ban} {...props} />;
}

export function NotFoundState(props: Preset) {
  return <StateView icon={SearchX} {...props} />;
}

export interface LoadingStateProps {
  /** Accessible, translated label such as "Loading". */
  label: string;
  rows?: number;
  className?: string;
}

const widths = ["w-2/5", "w-full", "w-5/6", "w-3/5"] as const;

export function LoadingState({ label, rows = 4, className }: LoadingStateProps) {
  return (
    <output aria-busy="true" className={cn("grid gap-3 p-5", className)}>
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className={widths[i % widths.length] ?? "w-full"} />
      ))}
    </output>
  );
}
