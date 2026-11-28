import { X } from "lucide-react";
import {
  Button as AriaButton,
  Text,
  UNSTABLE_Toast as AriaToast,
  UNSTABLE_ToastContent as ToastContent,
  UNSTABLE_ToastRegion as ToastRegion,
} from "react-aria-components";
import { toastQueue } from "./toast-queue";

export function ToastHost({
  closeLabel,
  regionLabel,
}: {
  closeLabel: string;
  regionLabel: string;
}) {
  return (
    <ToastRegion
      queue={toastQueue}
      aria-label={regionLabel}
      className="fixed end-4 bottom-4 z-[60] flex flex-col gap-2 outline-none"
    >
      {({ toast: queued }) => (
        <AriaToast
          toast={queued}
          className="flex w-80 max-w-[calc(100vw-2rem)] items-start gap-3 rounded-lg border bg-popover p-3 text-popover-foreground shadow-lg outline-none data-[focus-visible]:ring-[3px] data-[focus-visible]:ring-ring/50"
        >
          <ToastContent className="grid min-w-0 flex-1 gap-0.5">
            <Text slot="title" className="text-sm font-medium">
              {queued.content.title}
            </Text>
            {queued.content.description ? (
              <Text slot="description" className="text-sm text-muted-foreground">
                {queued.content.description}
              </Text>
            ) : null}
          </ToastContent>
          <AriaButton
            slot="close"
            aria-label={closeLabel}
            className="grid size-6 place-items-center rounded-sm outline-none data-[hovered]:bg-accent data-[focus-visible]:ring-2 data-[focus-visible]:ring-ring"
          >
            <X aria-hidden className="size-4" />
          </AriaButton>
        </AriaToast>
      )}
    </ToastRegion>
  );
}
