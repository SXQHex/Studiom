import type { ReactNode } from "react";
import {
  OverlayArrow,
  Tooltip as AriaTooltip,
  TooltipTrigger,
  type TooltipProps as AriaTooltipProps,
} from "react-aria-components";
import { cn } from "../lib/cn";

export { TooltipTrigger };

export function Tooltip({
  children,
  className,
  ...props
}: Omit<AriaTooltipProps, "className" | "children"> & { className?: string; children: ReactNode }) {
  return (
    <AriaTooltip
      offset={6}
      {...props}
      className={cn(
        "z-50 rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground data-[entering]:animate-in data-[entering]:fade-in-0 data-[exiting]:animate-out data-[exiting]:fade-out-0",
        className,
      )}
    >
      <OverlayArrow className="[&>svg]:block [&>svg]:fill-primary">
        <svg width="8" height="8" viewBox="0 0 8 8" aria-hidden>
          <path d="M0 0 L4 4 L8 0" />
        </svg>
      </OverlayArrow>
      {children}
    </AriaTooltip>
  );
}
