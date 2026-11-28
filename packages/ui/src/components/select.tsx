import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import {
  ListBox,
  ListBoxItem,
  Popover,
  Select as AriaSelect,
  SelectValue,
  type ListBoxItemProps,
  type SelectProps as AriaSelectProps,
} from "react-aria-components";
import { cn } from "../lib/cn";
import { Button } from "./button";
import { FieldDescription, FieldError, FieldLabel } from "./input";

export interface SelectProps<T extends object> extends Omit<
  AriaSelectProps<T>,
  "children" | "className"
> {
  label: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  className?: string;
  children: ReactNode | ((item: T) => ReactNode);
  items?: Iterable<T>;
}

export function Select<T extends object>({
  label,
  description,
  errorMessage,
  className,
  children,
  items,
  ...props
}: SelectProps<T>) {
  return (
    <AriaSelect {...props} className={cn("grid gap-2", className)}>
      <FieldLabel>{label}</FieldLabel>
      <Button
        variant="outline"
        className="w-full justify-between font-normal data-[invalid]:border-destructive"
      >
        <SelectValue className="truncate data-[placeholder]:text-muted-foreground" />
        <ChevronDown aria-hidden className="size-4 opacity-50" />
      </Button>
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError>{errorMessage}</FieldError>
      <Popover className="w-(--trigger-width) min-w-32 overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md data-[entering]:animate-in data-[entering]:fade-in-0">
        <ListBox {...(items ? { items } : {})} className="max-h-72 p-1 outline-none">
          {children}
        </ListBox>
      </Popover>
    </AriaSelect>
  );
}

export function SelectItem(props: ListBoxItemProps) {
  return (
    <ListBoxItem
      {...props}
      className={(renderProps) =>
        cn(
          "flex min-h-8 cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none",
          "data-[focused]:bg-accent data-[focused]:text-accent-foreground data-[selected]:font-medium data-[disabled]:opacity-50",
          typeof props.className === "function" ? props.className(renderProps) : props.className,
        )
      }
    />
  );
}
