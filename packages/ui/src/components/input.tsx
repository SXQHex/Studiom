import type { ReactNode } from "react";
import {
  FieldError as AriaFieldError,
  Input as AriaInput,
  Label as AriaLabel,
  Text,
  TextField as AriaTextField,
  type InputProps as AriaInputProps,
  type TextFieldProps as AriaTextFieldProps,
} from "react-aria-components";
import { cn } from "../lib/cn";

const inputClassName =
  "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground md:text-sm data-[focused]:border-ring data-[focused]:ring-[3px] data-[focused]:ring-ring/50 data-[invalid]:border-destructive data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50";

export function Input({ className, ...props }: AriaInputProps) {
  return (
    <AriaInput
      {...props}
      className={(renderProps) =>
        cn(
          inputClassName,
          "data-[focus-visible]:border-ring",
          typeof className === "function" ? className(renderProps) : className,
        )
      }
    />
  );
}

export function FieldLabel({ className, ...props }: React.ComponentProps<typeof AriaLabel>) {
  return (
    <AriaLabel
      {...props}
      className={cn("text-sm leading-none font-medium select-none", className)}
    />
  );
}

export function FieldError({ className, ...props }: React.ComponentProps<typeof AriaFieldError>) {
  return <AriaFieldError {...props} className={cn("text-sm text-destructive", className)} />;
}

export function FieldDescription({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Text>, "slot">) {
  return (
    <Text
      {...props}
      slot="description"
      className={cn("text-sm text-muted-foreground", className)}
    />
  );
}

export interface TextFieldProps extends AriaTextFieldProps {
  label: ReactNode;
  description?: ReactNode;
  errorMessage?: ReactNode;
  placeholder?: string;
}

/** Labelled text field. A visible label is mandatory (WCAG 3.3.2, 4.1.2). */
export function TextField({
  label,
  description,
  errorMessage,
  placeholder,
  className,
  ...props
}: TextFieldProps) {
  return (
    <AriaTextField
      {...props}
      className={cn("grid gap-2", typeof className === "string" ? className : undefined)}
    >
      <FieldLabel>{label}</FieldLabel>
      <Input placeholder={placeholder ?? ""} />
      {description ? <FieldDescription>{description}</FieldDescription> : null}
      <FieldError>{errorMessage}</FieldError>
    </AriaTextField>
  );
}
