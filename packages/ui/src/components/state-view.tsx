import type { ReactNode } from "react"
import {
  CircleXIcon,
  InboxIcon,
  LockIcon,
  PackageIcon,
  SearchIcon,
} from "lucide-react"

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@workspace/ui/components/empty"

const icons = {
  empty: InboxIcon,
  error: CircleXIcon,
  forbidden: LockIcon,
  outOfPlan: PackageIcon,
  notFound: SearchIcon,
} as const

/** What a list or page shows instead of its content. */
function StateView({
  kind,
  title,
  description,
  headingLevel = 2,
  children,
}: {
  kind: keyof typeof icons
  title: string
  description?: string
  /** 1 when the state is the whole page. */
  headingLevel?: 1 | 2
  /** Actions, for example a retry button. */
  children?: ReactNode
}) {
  const Icon = icons[kind]
  const Heading = headingLevel === 1 ? "h1" : "h2"

  return (
    <Empty data-kind={kind} role={kind === "error" ? "alert" : undefined}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon aria-hidden />
        </EmptyMedia>
        <EmptyTitle>
          <Heading>{title}</Heading>
        </EmptyTitle>
        {description === undefined ? null : (
          <EmptyDescription>{description}</EmptyDescription>
        )}
      </EmptyHeader>
      {children === undefined ? null : <EmptyContent>{children}</EmptyContent>}
    </Empty>
  )
}

export { StateView }
