import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  [
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap",
    "outline-none transition-colors",
    "data-[focus-visible]:ring-[3px] data-[focus-visible]:ring-ring/50",
    "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ],
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground data-[hovered]:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground data-[hovered]:bg-destructive/90",
        outline:
          "border bg-background shadow-xs data-[hovered]:bg-accent data-[hovered]:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground data-[hovered]:bg-secondary/80",
        ghost: "data-[hovered]:bg-accent data-[hovered]:text-accent-foreground",
        link: "text-primary underline-offset-4 data-[hovered]:underline",
      },
      // WCAG 2.2 target size (2.5.8): every size is at least 24x24 CSS px.
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 gap-1.5 px-3",
        lg: "h-10 px-6",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
