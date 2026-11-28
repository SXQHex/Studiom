import { useCallback, useId, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { useLocale } from "react-aria-components";
import { cn } from "../lib/cn";
import {
  DAYS_PER_WEEK,
  formatMinutes,
  keyToAction,
  moveSlot,
  pointerDeltaToSlotDelta,
  resizeSlot,
  slotsEqual,
  type Bounds,
  type Slot,
} from "./calendar-math";

export interface CalendarEvent extends Slot {
  id: string;
  title: string;
}

export interface WeekCalendarProps {
  events: readonly CalendarEvent[];
  /** Called with the new slot after a drag, resize or keyboard change. The parent owns the state. */
  onSlotChange: (id: string, slot: Slot) => void;
  /** Enter or double click. This is the single-pointer, no-drag alternative (WCAG 2.5.7): the edit form. */
  onOpen?: (id: string) => void;
  /** Seven already-localized day headers, first day of the week first. */
  dayLabels: readonly string[];
  /** Accessible name of the grid, translated by the app. */
  label: string;
  /**
   * Extra screen-reader text for one event, usually its day ("Tuesday"). The accessible name is
   * the visible text (title, time) followed by this, so it always contains the visible label (WCAG 2.5.3).
   */
  describeDay: (event: CalendarEvent) => string;
  /** Live-region text after a change, e.g. "Salsa moved to Wednesday 09:15". */
  describeChange: (event: CalendarEvent, next: Slot) => string;
  /** Short usage hint, linked to every event through aria-describedby. */
  hint: string;
  firstHour?: number;
  lastHour?: number;
  /** Minutes per snap step. */
  step?: number;
  /** CSS pixels per hour. */
  hourHeight?: number;
}

type Gesture = {
  id: string;
  kind: "move" | "resize";
  dx: number;
  dy: number;
  /** Column width measured when the gesture starts, so render never reads the DOM. */
  columnWidth: number;
};

/**
 * Week calendar spike (T06, ADR-013): drag to move, drag the bottom handle to resize,
 * Shift+arrows to move and Alt+Shift+Up/Down to resize, RTL-aware, with a live announcement.
 * Overlapping events, current-time line, filters and the edit form belong to T19.
 */
export function WeekCalendar({
  events,
  onSlotChange,
  onOpen,
  dayLabels,
  label,
  describeDay,
  describeChange,
  hint,
  firstHour = 6,
  lastHour = 22,
  step = 15,
  hourHeight = 56,
}: WeekCalendarProps) {
  const { locale, direction } = useLocale();
  const rtl = direction === "rtl";
  const hintId = useId();
  const gridRef = useRef<HTMLFieldSetElement>(null);
  const [gesture, setGesture] = useState<Gesture | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const origin = useRef<{ x: number; y: number } | null>(null);

  const pxPerMinute = hourHeight / 60;
  const bounds: Bounds = { minStart: firstHour * 60, maxEnd: lastHour * 60, minDuration: step };
  const hours = Array.from({ length: lastHour - firstHour }, (_, i) => firstHour + i);
  const hourFormat = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" });

  const apply = useCallback(
    (event: CalendarEvent, next: Slot) => {
      if (slotsEqual(event, next)) return;
      onSlotChange(event.id, next);
      setAnnouncement(describeChange(event, next));
    },
    [onSlotChange, describeChange],
  );

  const onKeyDown = (event: CalendarEvent, e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" && onOpen) {
      e.preventDefault();
      onOpen(event.id);
      return;
    }
    const action = keyToAction(e, step, rtl);
    if (!action) return;
    e.preventDefault();
    apply(
      event,
      action.kind === "move"
        ? moveSlot(event, action.dayDelta, action.minuteDelta, bounds)
        : resizeSlot(event, action.minuteDelta, bounds),
    );
  };

  const begin = (id: string, kind: Gesture["kind"], e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    origin.current = { x: e.clientX, y: e.clientY };
    const grid = gridRef.current;
    setGesture({
      id,
      kind,
      dx: 0,
      dy: 0,
      columnWidth: grid ? grid.clientWidth / DAYS_PER_WEEK : 0,
    });
  };

  const track = (e: PointerEvent<HTMLElement>) => {
    const o = origin.current;
    if (!o) return;
    setGesture((g) => (g ? { ...g, dx: e.clientX - o.x, dy: e.clientY - o.y } : g));
  };

  const finish = (event: CalendarEvent, e: PointerEvent<HTMLElement>) => {
    const g = gesture;
    origin.current = null;
    setGesture(null);
    if (!g || e.type === "pointercancel") return;
    const delta = pointerDeltaToSlotDelta(g.dx, g.dy, {
      columnWidth: g.columnWidth,
      pixelsPerMinute: pxPerMinute,
      step,
      rtl,
    });
    apply(
      event,
      g.kind === "move"
        ? moveSlot(event, delta.dayDelta, delta.minuteDelta, bounds)
        : resizeSlot(event, delta.minuteDelta, bounds),
    );
  };

  const previewOf = (event: CalendarEvent): Slot => {
    if (!gesture || gesture.id !== event.id) return event;
    const delta = pointerDeltaToSlotDelta(gesture.dx, gesture.dy, {
      columnWidth: gesture.columnWidth,
      pixelsPerMinute: pxPerMinute,
      step,
      rtl,
    });
    return gesture.kind === "move"
      ? moveSlot(event, delta.dayDelta, delta.minuteDelta, bounds)
      : resizeSlot(event, delta.minuteDelta, bounds);
  };

  return (
    <div className="grid grid-cols-[3.5rem_1fr] text-sm">
      <p id={hintId} className="sr-only">
        {hint}
      </p>
      <output className="sr-only">{announcement}</output>
      <div />
      <div className="grid grid-cols-7 border-b" aria-hidden>
        {dayLabels.map((d) => (
          <div key={d} className="px-2 py-2 text-center font-medium text-muted-foreground">
            {d}
          </div>
        ))}
      </div>
      <div className="relative" style={{ height: hours.length * hourHeight }} aria-hidden>
        {hours.map((h, i) => (
          <span
            key={h}
            className="absolute end-2 -translate-y-1/2 text-xs text-muted-foreground tabular-nums"
            style={{ top: i * hourHeight }}
          >
            {i === 0 ? "" : hourFormat.format(new Date(2000, 0, 1, h))}
          </span>
        ))}
      </div>
      <fieldset
        ref={gridRef}
        aria-label={label}
        className="relative m-0 grid min-w-0 grid-cols-7 border-0 p-0"
        style={{ height: hours.length * hourHeight }}
      >
        {Array.from({ length: DAYS_PER_WEEK }, (_, day) => (
          <div key={day} className="relative border-s" aria-hidden>
            {hours.map((h, i) => (
              <div
                key={h}
                className="absolute inset-x-0 border-t"
                style={{ top: i * hourHeight }}
              />
            ))}
          </div>
        ))}
        {events.map((event) => {
          const slot = previewOf(event);
          const dragging = gesture?.id === event.id;
          return (
            <button
              key={event.id}
              type="button"
              aria-describedby={hintId}
              onKeyDown={(e) => onKeyDown(event, e)}
              onDoubleClick={() => onOpen?.(event.id)}
              onPointerDown={(e) => begin(event.id, "move", e)}
              onPointerMove={track}
              onPointerUp={(e) => finish(event, e)}
              onPointerCancel={(e) => finish(event, e)}
              className={cn(
                "absolute z-10 touch-none overflow-hidden rounded-md border bg-primary px-2 py-1 text-xs text-primary-foreground select-none",
                "cursor-grab outline-none data-[dragging=true]:cursor-grabbing data-[dragging=true]:opacity-80",
                "focus-visible:ring-[3px] focus-visible:ring-ring",
              )}
              data-dragging={dragging}
              style={{
                insetInlineStart: `calc(${slot.day} * 100% / ${DAYS_PER_WEEK} + 2px)`,
                width: `calc(100% / ${DAYS_PER_WEEK} - 4px)`,
                top: (slot.start - bounds.minStart) * pxPerMinute,
                height: slot.duration * pxPerMinute,
              }}
            >
              <span className="block truncate text-start font-medium">{event.title}</span>
              <span className="sr-only">{describeDay(event)}</span>
              <span className="block truncate text-start opacity-80 tabular-nums">
                {formatMinutes(slot.start)} - {formatMinutes(slot.start + slot.duration)}
              </span>
              <span
                aria-hidden
                onPointerDown={(e) => {
                  e.stopPropagation();
                  begin(event.id, "resize", e);
                }}
                onPointerMove={track}
                onPointerUp={(e) => {
                  e.stopPropagation();
                  finish(event, e);
                }}
                onPointerCancel={(e) => finish(event, e)}
                className="absolute inset-x-0 bottom-0 block h-3 cursor-ns-resize touch-none"
              >
                <span className="mx-auto mt-1 block h-0.5 w-6 rounded-full bg-primary-foreground/60" />
              </span>
            </button>
          );
        })}
      </fieldset>
    </div>
  );
}
