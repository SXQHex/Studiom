/** Pure geometry and keyboard rules for the week calendar. No DOM, no React. */

export const DAYS_PER_WEEK = 7;

export interface Slot {
  /** 0 = first day of the week as laid out by the grid. */
  day: number;
  /** Minutes from midnight, in the center's own time zone. */
  start: number;
  /** Minutes. */
  duration: number;
}

export interface Bounds {
  /** First visible minute of the day grid. */
  minStart: number;
  /** End of the last visible minute (exclusive). */
  maxEnd: number;
  minDuration: number;
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

export const snap = (value: number, step: number): number => Math.round(value / step) * step;

export function moveSlot(slot: Slot, dayDelta: number, minuteDelta: number, bounds: Bounds): Slot {
  const start = clamp(slot.start + minuteDelta, bounds.minStart, bounds.maxEnd - slot.duration);
  return { ...slot, day: clamp(slot.day + dayDelta, 0, DAYS_PER_WEEK - 1), start };
}

export function resizeSlot(slot: Slot, minuteDelta: number, bounds: Bounds): Slot {
  const maxDuration = bounds.maxEnd - slot.start;
  return { ...slot, duration: clamp(slot.duration + minuteDelta, bounds.minDuration, maxDuration) };
}

export interface PixelMetrics {
  columnWidth: number;
  pixelsPerMinute: number;
  step: number;
  /** Right-to-left grids put the first day on the right, so a rightward drag goes back in time. */
  rtl: boolean;
}

export function pointerDeltaToSlotDelta(dx: number, dy: number, m: PixelMetrics) {
  const rawDays = m.columnWidth > 0 ? Math.round(dx / m.columnWidth) : 0;
  const dayDelta = m.rtl ? -rawDays : rawDays;
  const minuteDelta = snap(dy / m.pixelsPerMinute, m.step);
  // `|| 0` turns -0 (from negating 0 in RTL) into 0.
  return { dayDelta: dayDelta || 0, minuteDelta };
}

export type KeyAction =
  | { kind: "move"; dayDelta: number; minuteDelta: number }
  | { kind: "resize"; minuteDelta: number };

export interface KeyInput {
  key: string;
  shiftKey: boolean;
  altKey: boolean;
}

/**
 * Keyboard model (prototype: "Shift + ok", WCAG 2.5.7 alternative to dragging):
 * Shift+Left/Right moves by one day, Shift+Up/Down by one step,
 * Alt+Shift+Up/Down changes the duration by one step.
 * Plain arrows are left to the browser and to grid navigation.
 */
export function keyToAction(input: KeyInput, step: number, rtl: boolean): KeyAction | null {
  if (!input.shiftKey) return null;
  const horizontal = rtl ? -1 : 1;
  if (input.altKey) {
    if (input.key === "ArrowUp") return { kind: "resize", minuteDelta: -step };
    if (input.key === "ArrowDown") return { kind: "resize", minuteDelta: step };
    return null;
  }
  switch (input.key) {
    case "ArrowLeft":
      return { kind: "move", dayDelta: -horizontal, minuteDelta: 0 };
    case "ArrowRight":
      return { kind: "move", dayDelta: horizontal, minuteDelta: 0 };
    case "ArrowUp":
      return { kind: "move", dayDelta: 0, minuteDelta: -step };
    case "ArrowDown":
      return { kind: "move", dayDelta: 0, minuteDelta: step };
    default:
      return null;
  }
}

export const slotsEqual = (a: Slot, b: Slot): boolean =>
  a.day === b.day && a.start === b.start && a.duration === b.duration;

/** `HH:mm` for a minute offset, locale-independent; used only as a fallback label. */
export function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}
