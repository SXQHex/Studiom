import * as React from "react"
import { cn } from "cn"
import {
  Heading,
  ModalOverlay as ModalOverlayPrimitive,
  Modal as ModalPrimitive,
  Dialog as SheetPrimitive,
  DialogTrigger as SheetTriggerPrimitive,
  type ModalOverlayProps as ModalOverlayPrimitiveProps,
  type DialogProps as SheetPrimitiveProps,
  type DialogTriggerProps as SheetTriggerPrimitiveProps,
} from "react-aria-components"

import { Button } from "@workspace/ui/components/button"
import { XIcon } from "lucide-react"

function SheetTrigger({ ...props }: SheetTriggerPrimitiveProps) {
  return <SheetTriggerPrimitive data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  className,
  variant = "outline",
  size = "default",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      slot="close"
      data-slot="sheet-close"
      variant={variant}
      size={size}
      className={cn(className)}
      {...props}
    />
  )
}

function SheetOverlay({
  className,
  children,
  ...props
}: Omit<ModalOverlayPrimitiveProps, "className" | "children"> & {
  className?: string
  children: React.ReactNode
}) {
  return (
    <ModalOverlayPrimitive
      data-slot="sheet-overlay"
      isDismissable
      className={cn(
        "fixed inset-0 z-50 bg-black/30 transition-opacity duration-150 data-entering:opacity-0 data-exiting:opacity-0 supports-backdrop-filter:backdrop-blur-sm",
        className
      )}
      {...props}
    >
      {children}
    </ModalOverlayPrimitive>
  )
}

/** `start` and `end` follow the text direction: `end` is the right edge in Turkish. */
function Sheet({
  className,
  children,
  side = "end",
  showCloseButton = true,
  closeLabel,
  ...props
}: Omit<ModalOverlayPrimitiveProps, "className" | "children"> &
  Pick<React.ComponentProps<typeof ModalPrimitive>, "isDismissable"> & {
    className?: string | undefined
    children: React.ReactNode
    side?: "top" | "bottom" | "start" | "end"
    showCloseButton?: boolean
    /** Translated accessible name of the close button. */
    closeLabel: string
  }) {
  return (
    <SheetOverlay {...props}>
      <ModalPrimitive
        data-slot="sheet-content"
        data-side={side}
        className={cn(
          "fixed z-50 flex flex-col bg-popover bg-clip-padding text-sm text-popover-foreground shadow-xl transition duration-200 ease-in-out data-entering:opacity-0 data-exiting:opacity-0 data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=bottom]:data-entering:translate-y-[2.5rem] data-[side=bottom]:data-exiting:translate-y-[2.5rem] data-[side=end]:inset-y-0 data-[side=end]:inset-e-0 data-[side=end]:h-full data-[side=end]:w-3/4 data-[side=end]:border-s data-[side=end]:data-entering:translate-x-[2.5rem] data-[side=end]:data-exiting:translate-x-[2.5rem] data-[side=start]:inset-y-0 data-[side=start]:inset-s-0 data-[side=start]:h-full data-[side=start]:w-3/4 data-[side=start]:border-e data-[side=start]:data-entering:translate-x-[-2.5rem] data-[side=start]:data-exiting:translate-x-[-2.5rem] data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=top]:data-entering:translate-y-[-2.5rem] data-[side=top]:data-exiting:translate-y-[-2.5rem] data-[side=end]:sm:max-w-sm data-[side=start]:sm:max-w-sm rtl:data-[side=end]:data-entering:translate-x-[-2.5rem] rtl:data-[side=end]:data-exiting:translate-x-[-2.5rem] rtl:data-[side=start]:data-entering:translate-x-[2.5rem] rtl:data-[side=start]:data-exiting:translate-x-[2.5rem]",
          className
        )}
      >
        <SheetPrimitive
          data-slot="sheet"
          className="[display:inherit] h-full max-h-[inherit] [flex-direction:inherit] [gap:inherit] outline-none"
        >
          {children}
          {showCloseButton && (
            <SheetClose
              variant="ghost"
              className="absolute end-4 top-4 bg-secondary"
              size="icon-sm"
            >
              <XIcon />
              <span className="sr-only">{closeLabel}</span>
            </SheetClose>
          )}
        </SheetPrimitive>
      </ModalPrimitive>
    </SheetOverlay>
  )
}

function SheetContent({
  className,
  children,
  side = "end",
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof Sheet> & {
  side?: "top" | "bottom" | "start" | "end"
  showCloseButton?: boolean
}) {
  return (
    <Sheet
      className={className}
      side={side}
      showCloseButton={showCloseButton}
      {...props}
    >
      {children}
    </Sheet>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1.5 p-6", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-6", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: Omit<React.ComponentProps<typeof Heading>, "slot">) {
  return (
    <Heading
      slot="title"
      data-slot="sheet-title"
      className={cn(
        "font-heading text-base font-medium text-foreground",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: Omit<React.ComponentProps<"div">, "slot">) {
  return (
    <div
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  type SheetPrimitiveProps,
  type SheetTriggerPrimitiveProps,
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
