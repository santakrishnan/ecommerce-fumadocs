"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface RemovableItem {
  /** Alt text for the thumbnail. */
  imageAlt: string;
  /** Thumbnail image src for the undo row. */
  imageSrc: string;
  /** Display title for the undo message (e.g. "TOYOTA RAV4 XSE"). */
  title: string;
  /** Unique vehicle identifier (17-char VIN). */
  vin: string;
}

interface PendingRemoval<T extends RemovableItem> {
  /** The item being removed. */
  item: T;
  /** Original index in the list (for restoration). */
  originalIndex: number;
  /** Timer id for auto-finalize. */
  timerId: ReturnType<typeof setTimeout>;
}

export interface UseRemovableListOptions<T extends RemovableItem> {
  /** Initial list of items. */
  items: T[];
  /**
   * Called exactly once when removal finalizes (timer elapsed without undo).
   * This is the seam for future persistence integration.
   */
  onRemoveVehicle?: (vin: string) => void;
  /** Undo window duration in ms (default: 30 000). */
  undoWindowMs?: number;
}

export interface UseRemovableListResult<T extends RemovableItem> {
  /** Map of VINs currently pending removal → metadata for the undo row. */
  pendingRemovals: Map<string, { item: T; originalIndex: number }>;
  /** Trigger removal of a vehicle by VIN (optimistic). */
  removeVehicle: (vin: string) => void;
  /** Undo a pending removal — restores the item at its original position. */
  undoRemoval: (vin: string) => void;
  /** The visible list — items pending removal are excluded. */
  visibleItems: T[];
}

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * Manages optimistic removal + undo for a list of vehicles.
 *
 * - `removeVehicle(vin)` immediately hides the card and starts the undo timer.
 * - `undoRemoval(vin)` restores the card at its original index, cancelling finalize.
 * - When the timer elapses, `onRemoveVehicle(vin)` fires exactly once and the
 *   pending entry is cleaned up.
 *
 * Multiple concurrent removals are tracked independently — no cross-talk.
 * This hook does NOT call any API or mock. Persistence is a future story.
 */
export function useRemovableList<T extends RemovableItem>({
  items,
  undoWindowMs = 30_000,
  onRemoveVehicle,
}: UseRemovableListOptions<T>): UseRemovableListResult<T> {
  // Source-of-truth list (tracks additions/restorations).
  const [list, setList] = useState<T[]>(items);
  const [pending, setPending] = useState<Map<string, PendingRemoval<T>>>(new Map());

  // Keep a ref to onRemoveVehicle so finalize closures always see latest.
  const onRemoveRef = useRef(onRemoveVehicle);
  onRemoveRef.current = onRemoveVehicle;

  // Keep a ref to pending so unmount cleanup always sees the latest timers.
  const pendingRef = useRef(pending);
  pendingRef.current = pending;

  // Sync if parent items change (e.g. re-fetch).
  //
  // Depends on a stable VIN-derived signature rather than the `items` array
  // reference: callers commonly pass a freshly-created array on every render
  // (e.g. `useRemovableList({ items: data.map(...) })`), which would give
  // this effect a new dependency identity every render and re-fire forever —
  // `setList` triggers a re-render, which creates a new `items` array, which
  // reruns the effect, ad infinitum. Comparing by VIN content instead means
  // the effect only re-syncs when the actual set of items changes.
  const itemsSignature = items.map((item) => item.vin).join(",");
  useEffect(() => {
    setList(items);
  }, [itemsSignature]);

  // Cleanup timers on unmount.
  useEffect(
    () => () => {
      for (const { timerId } of pendingRef.current.values()) {
        clearTimeout(timerId);
      }
    },
    []
  );

  const finalize = useCallback((vin: string) => {
    setPending((prev) => {
      const next = new Map(prev);
      next.delete(vin);
      return next;
    });
    // Fire the seam callback exactly once.
    onRemoveRef.current?.(vin);
  }, []);

  const removeVehicle = useCallback(
    (vin: string) => {
      const index = list.findIndex((item) => item.vin === vin);
      if (index === -1) {
        return;
      }

      const item = list[index] as T;

      // Remove from visible list.
      setList((prev) => prev.filter((i) => i.vin !== vin));

      // Start undo timer.
      const timerId = setTimeout(() => finalize(vin), undoWindowMs);

      setPending((prev) => {
        const next = new Map(prev);
        next.set(vin, { item, originalIndex: index, timerId });
        return next;
      });
    },
    [list, undoWindowMs, finalize]
  );

  const undoRemoval = useCallback(
    (vin: string) => {
      const entry = pending.get(vin);
      if (!entry) {
        return;
      }

      // Cancel the timer.
      clearTimeout(entry.timerId);

      // Remove from pending.
      setPending((prev) => {
        const next = new Map(prev);
        next.delete(vin);
        return next;
      });

      // Restore item at its original position (with guard against duplicates).
      setList((prevList) => {
        if (prevList.some((item) => item.vin === vin)) {
          return prevList;
        }
        const next = [...prevList];
        const insertAt = Math.min(entry.originalIndex, next.length);
        next.splice(insertAt, 0, entry.item);
        return next;
      });
    },
    [pending]
  );

  // Compute visible items — those not in pending.
  const visibleItems = list;

  // Expose pending removals without internal timerId.
  const pendingRemovals = new Map<string, { item: T; originalIndex: number }>();
  pending.forEach(({ item, originalIndex }, vin) => {
    pendingRemovals.set(vin, { item, originalIndex });
  });

  return {
    visibleItems,
    pendingRemovals,
    removeVehicle,
    undoRemoval,
  };
}
