import { describe, expect, it } from "vitest";
import {
  clamp,
  keyToAction,
  moveSlot,
  pointerDeltaToSlotDelta,
  resizeSlot,
  snap,
  type Bounds,
  type Slot,
} from "./calendar-math";

const bounds: Bounds = { minStart: 6 * 60, maxEnd: 22 * 60, minDuration: 15 };
const slot: Slot = { day: 2, start: 9 * 60, duration: 60 };

describe("snap and clamp", () => {
  it("snaps to the step", () => {
    expect(snap(22, 15)).toBe(15);
    expect(snap(23, 15)).toBe(30);
  });
  it("clamps", () => {
    expect(clamp(9, 0, 5)).toBe(5);
    expect(clamp(-1, 0, 5)).toBe(0);
  });
});

describe("moveSlot", () => {
  it("moves by days and minutes", () => {
    expect(moveSlot(slot, 1, 30, bounds)).toEqual({ day: 3, start: 9 * 60 + 30, duration: 60 });
  });
  it("stays inside the week", () => {
    expect(moveSlot(slot, -9, 0, bounds).day).toBe(0);
    expect(moveSlot(slot, 9, 0, bounds).day).toBe(6);
  });
  it("stays inside the visible hours, keeping the full duration", () => {
    expect(moveSlot(slot, 0, -600, bounds).start).toBe(6 * 60);
    expect(moveSlot(slot, 0, 900, bounds).start).toBe(22 * 60 - 60);
  });
});

describe("resizeSlot", () => {
  it("never goes below the minimum or past the end of the day grid", () => {
    expect(resizeSlot(slot, -600, bounds).duration).toBe(15);
    expect(resizeSlot(slot, 6000, bounds).duration).toBe(22 * 60 - 9 * 60);
  });
});

describe("pointerDeltaToSlotDelta", () => {
  const m = { columnWidth: 100, pixelsPerMinute: 1, step: 15, rtl: false };
  it("rounds to whole days and snapped minutes", () => {
    expect(pointerDeltaToSlotDelta(160, 40, m)).toEqual({ dayDelta: 2, minuteDelta: 45 });
  });
  it("mirrors the day axis in RTL", () => {
    expect(pointerDeltaToSlotDelta(100, 0, { ...m, rtl: true }).dayDelta).toBe(-1);
  });
});

const k = (key: string, alt = false) => ({ key, shiftKey: true, altKey: alt });

describe("keyToAction", () => {
  it("ignores keys without Shift", () => {
    expect(keyToAction({ key: "ArrowUp", shiftKey: false, altKey: false }, 15, false)).toBeNull();
  });
  it("moves with Shift+arrows", () => {
    expect(keyToAction(k("ArrowRight"), 15, false)).toEqual({
      kind: "move",
      dayDelta: 1,
      minuteDelta: 0,
    });
    expect(keyToAction(k("ArrowDown"), 15, false)).toEqual({
      kind: "move",
      dayDelta: 0,
      minuteDelta: 15,
    });
  });
  it("mirrors left and right in RTL", () => {
    expect(keyToAction(k("ArrowRight"), 15, true)).toEqual({
      kind: "move",
      dayDelta: -1,
      minuteDelta: 0,
    });
  });
  it("resizes with Alt+Shift+Up/Down", () => {
    expect(keyToAction(k("ArrowDown", true), 15, false)).toEqual({
      kind: "resize",
      minuteDelta: 15,
    });
    expect(keyToAction(k("ArrowLeft", true), 15, false)).toBeNull();
  });
});
