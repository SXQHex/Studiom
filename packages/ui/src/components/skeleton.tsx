import type { HTMLAttributes } from "react";
import { cn } from "../lib/cn";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      {...props}
      className={cn(
        "h-4 w-full animate-pulse rounded-md bg-muted motion-reduce:animate-none",
        className,
      )}
    />
  );
}
