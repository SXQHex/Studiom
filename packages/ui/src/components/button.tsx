import { Button as AriaButton, type ButtonProps as AriaButtonProps } from "react-aria-components";
import { cn } from "../lib/cn";
import { buttonVariants, type ButtonVariants } from "./button-variants";

export interface ButtonProps extends AriaButtonProps, ButtonVariants {
  className?: string;
}

export function Button({ variant, size, className, ...props }: ButtonProps) {
  return <AriaButton {...props} className={cn(buttonVariants({ variant, size }), className)} />;
}
