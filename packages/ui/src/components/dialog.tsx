import { X } from "lucide-react";
import { createContext, useContext, type ReactNode } from "react";
import {
  Dialog as AriaDialog,
  DialogTrigger,
  Heading,
  Modal,
  ModalOverlay,
  type DialogProps as AriaDialogProps,
} from "react-aria-components";
import { cn } from "../lib/cn";
import { Button, type ButtonProps } from "./button";

export { DialogTrigger };

const DialogCloseContext = createContext<(() => void) | null>(null);

/** Button that closes the surrounding Dialog or Sheet. Use it in the footer. */
export function DialogClose({ children, ...props }: Omit<ButtonProps, "onPress">) {
  const close = useContext(DialogCloseContext);
  return (
    <Button {...props} onPress={() => close?.()}>
      {children}
    </Button>
  );
}

const overlay =
  "fixed inset-0 z-50 bg-black/50 data-[entering]:animate-in data-[entering]:fade-in-0 data-[exiting]:animate-out data-[exiting]:fade-out-0";

interface SurfaceProps extends Omit<AriaDialogProps, "children" | "className"> {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** Accessible name for the close button; the app supplies the translated string. */
  closeLabel: string;
  className?: string;
}

function Surface({
  title,
  description,
  children,
  footer,
  closeLabel,
  className,
  ...props
}: SurfaceProps) {
  return (
    <AriaDialog {...props} className={cn("relative grid gap-4 p-6 outline-none", className)}>
      {({ close }) => (
        <DialogCloseContext value={close}>
          <div className="grid gap-1.5 pe-8">
            <Heading slot="title" className="text-lg leading-none font-semibold">
              {title}
            </Heading>
            {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label={closeLabel}
            onPress={close}
            className="absolute end-3 top-3 size-8"
          >
            <X aria-hidden />
          </Button>
          <div>{children}</div>
          {footer ? <div className="flex flex-wrap justify-end gap-2">{footer}</div> : null}
        </DialogCloseContext>
      )}
    </AriaDialog>
  );
}

export interface DialogProps extends SurfaceProps {
  isDismissable?: boolean;
}

/** Centered modal dialog. Wrap in `DialogTrigger` or control with `isOpen` on the parent. */
export function Dialog({ isDismissable = true, ...props }: DialogProps) {
  return (
    <ModalOverlay
      isDismissable={isDismissable}
      className={cn(overlay, "grid place-items-center p-4")}
    >
      <Modal className="w-full max-w-lg rounded-xl border bg-background shadow-lg data-[entering]:animate-in data-[entering]:zoom-in-95">
        <Surface {...props} />
      </Modal>
    </ModalOverlay>
  );
}

export interface SheetProps extends SurfaceProps {
  /** Logical side: "end" is the right edge in LTR and the left edge in RTL. */
  side?: "start" | "end";
}

/** Side panel (prototype "yan panel"). Same dialog semantics, anchored to the inline edge. */
export function Sheet({ side = "end", className, ...props }: SheetProps) {
  return (
    <ModalOverlay isDismissable className={overlay}>
      <Modal
        className={cn(
          "fixed inset-y-0 h-full w-full max-w-md border-s bg-background shadow-lg",
          side === "end" ? "end-0 border-s" : "start-0 border-e",
        )}
      >
        <Surface {...props} className={cn("h-full content-start overflow-auto", className)} />
      </Modal>
    </ModalOverlay>
  );
}
