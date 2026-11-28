import {
  ToggleButton,
  ToggleButtonGroup,
  type ToggleButtonGroupProps,
  type ToggleButtonProps,
} from "react-aria-components";
import { cn } from "../lib/cn";

/** Segmented control (prototype `.seg`) on react-aria ToggleButtonGroup. */
export function Segment({
  className,
  ...props
}: Omit<ToggleButtonGroupProps, "className"> & { className?: string }) {
  return (
    <ToggleButtonGroup
      selectionMode="single"
      disallowEmptySelection
      {...props}
      className={cn("inline-flex rounded-md border bg-muted p-0.5", className)}
    />
  );
}

export function SegmentItem({
  className,
  ...props
}: Omit<ToggleButtonProps, "className"> & { className?: string }) {
  return (
    <ToggleButton
      {...props}
      className={cn(
        "inline-flex h-7 min-w-6 items-center justify-center rounded-sm px-3 text-sm font-medium outline-none transition-colors",
        "text-muted-foreground data-[hovered]:text-foreground",
        "data-[selected]:bg-background data-[selected]:text-foreground data-[selected]:shadow-xs",
        "data-[focus-visible]:ring-[3px] data-[focus-visible]:ring-ring/50 data-[disabled]:opacity-50",
        className,
      )}
    />
  );
}
