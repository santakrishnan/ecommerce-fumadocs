/// <reference types="@testing-library/jest-dom" />

import { act, renderHook } from "@ucmp/vitest-config/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { type RemovableItem, useRemovableList } from "../use-removable-list";

// ─── Fixtures ───────────────────────────────────────────────────────────────

interface TestItem extends RemovableItem {
  cardProps: { price: number };
}

const item1: TestItem = {
  vin: "JTMW1RFV5ND000001",
  title: "TOYOTA RAV4 XSE",
  imageSrc: "/img/rav4.jpg",
  imageAlt: "RAV4",
  cardProps: { price: 29_245 },
};

const item2: TestItem = {
  vin: "5TDGZRAH1PS000002",
  title: "TOYOTA HIGHLANDER XSE",
  imageSrc: "/img/highlander.jpg",
  imageAlt: "Highlander",
  cardProps: { price: 35_000 },
};

const item3: TestItem = {
  vin: "2T1BURHE0KC000003",
  title: "TOYOTA COROLLA LE",
  imageSrc: "/img/corolla.jpg",
  imageAlt: "Corolla",
  cardProps: { price: 22_000 },
};

// ─── Tests ──────────────────────────────────────────────────────────────────

describe("useRemovableList", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns all items as visibleItems initially", () => {
    const { result } = renderHook(() => useRemovableList({ items: [item1, item2] }));

    expect(result.current.visibleItems).toHaveLength(2);
    expect(result.current.pendingRemovals.size).toBe(0);
  });

  it("removes a vehicle from visibleItems on removeVehicle", () => {
    const { result } = renderHook(() => useRemovableList({ items: [item1, item2] }));

    act(() => result.current.removeVehicle(item1.vin));

    expect(result.current.visibleItems).toHaveLength(1);
    expect(result.current.visibleItems[0]?.vin).toBe(item2.vin);
    expect(result.current.pendingRemovals.size).toBe(1);
    expect(result.current.pendingRemovals.has(item1.vin)).toBe(true);
  });

  it("restores the vehicle at its original index on undoRemoval", () => {
    const { result } = renderHook(() => useRemovableList({ items: [item1, item2, item3] }));

    act(() => result.current.removeVehicle(item2.vin));

    expect(result.current.visibleItems).toHaveLength(2);

    act(() => result.current.undoRemoval(item2.vin));

    expect(result.current.visibleItems).toHaveLength(3);
    expect(result.current.visibleItems[1]?.vin).toBe(item2.vin);
    expect(result.current.pendingRemovals.size).toBe(0);
  });

  it("fires onRemoveVehicle exactly once after timeout elapses", () => {
    const onRemove = vi.fn();
    const { result } = renderHook(() =>
      useRemovableList({ items: [item1, item2], onRemoveVehicle: onRemove, undoWindowMs: 5000 })
    );

    act(() => result.current.removeVehicle(item1.vin));

    expect(onRemove).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledWith(item1.vin);
    expect(result.current.pendingRemovals.size).toBe(0);
  });

  it("does NOT fire onRemoveVehicle if undo is called before timeout", () => {
    const onRemove = vi.fn();
    const { result } = renderHook(() =>
      useRemovableList({ items: [item1], onRemoveVehicle: onRemove, undoWindowMs: 5000 })
    );

    act(() => result.current.removeVehicle(item1.vin));
    act(() => result.current.undoRemoval(item1.vin));

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(onRemove).not.toHaveBeenCalled();
  });

  it("handles multiple concurrent removals independently", () => {
    const onRemove = vi.fn();
    const { result } = renderHook(() =>
      useRemovableList({
        items: [item1, item2, item3],
        onRemoveVehicle: onRemove,
        undoWindowMs: 5000,
      })
    );

    act(() => result.current.removeVehicle(item1.vin));
    act(() => result.current.removeVehicle(item3.vin));

    expect(result.current.visibleItems).toHaveLength(1);
    expect(result.current.visibleItems[0]?.vin).toBe(item2.vin);
    expect(result.current.pendingRemovals.size).toBe(2);

    // Undo only item1
    act(() => result.current.undoRemoval(item1.vin));

    expect(result.current.visibleItems).toHaveLength(2);
    expect(result.current.pendingRemovals.size).toBe(1);

    // Finalize item3
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(onRemove).toHaveBeenCalledTimes(1);
    expect(onRemove).toHaveBeenCalledWith(item3.vin);
  });

  it("uses default 30s undo window", () => {
    const onRemove = vi.fn();
    const { result } = renderHook(() =>
      useRemovableList({ items: [item1], onRemoveVehicle: onRemove })
    );

    act(() => result.current.removeVehicle(item1.vin));

    act(() => {
      vi.advanceTimersByTime(29_999);
    });
    expect(onRemove).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it("does nothing when removing a non-existent VIN", () => {
    const { result } = renderHook(() => useRemovableList({ items: [item1] }));

    act(() => result.current.removeVehicle("NONEXISTENT0000000"));

    expect(result.current.visibleItems).toHaveLength(1);
    expect(result.current.pendingRemovals.size).toBe(0);
  });

  it("does nothing when undoing a non-pending VIN", () => {
    const { result } = renderHook(() => useRemovableList({ items: [item1] }));

    act(() => result.current.undoRemoval(item1.vin));

    expect(result.current.visibleItems).toHaveLength(1);
  });

  it("does not duplicate items on undo (dedup guard)", () => {
    const { result } = renderHook(() => useRemovableList({ items: [item1, item2] }));

    act(() => result.current.removeVehicle(item1.vin));
    act(() => result.current.undoRemoval(item1.vin));

    // Should not have duplicates
    const vins = result.current.visibleItems.map((i) => i.vin);
    expect(vins).toEqual([item1.vin, item2.vin]);
  });
});
