import { UNSTABLE_ToastQueue as ToastQueue } from "react-aria-components";

export interface ToastValue {
  title: string;
  description?: string;
  tone?: "default" | "success" | "error";
}

/** App-wide queue. react-aria marks the Toast API UNSTABLE_, it is the only first-party option. */
export const toastQueue = new ToastQueue<ToastValue>({ maxVisibleToasts: 3 });

/** Add a toast. Errors stay until dismissed (WCAG 2.2.1), others auto-dismiss after 6 s. */
export function toast(value: ToastValue): string {
  return toastQueue.add(value, value.tone === "error" ? {} : { timeout: 6000 });
}
