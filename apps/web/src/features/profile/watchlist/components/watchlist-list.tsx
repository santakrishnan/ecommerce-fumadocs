"use client";

import { Separator } from "@ucmp/ui";
import { IconClose, IconEdit, IconSwitch } from "@ucmp/ui/icons";
import { useState } from "react";
import { type RemovableItem, useRemovableList } from "../hooks/use-removable-list";
import type { WatchlistCardProps } from "./watchlist-card";
import { WatchlistCard } from "./watchlist-card";
import { WatchlistUndoRow } from "./watchlist-undo-row";

// ─── Types ──────────────────────────────────────────────────────────────────

/** Extended card data that includes the fields needed for the remove flow. */
export interface WatchlistVehicleItem extends RemovableItem {
  /** Full WatchlistCard props (minus overflow items — those are computed). */
  cardProps: Omit<WatchlistCardProps, "overflowItems">;
}

export interface WatchlistListProps {
  /** The list of watchlist vehicles to render. */
  items: WatchlistVehicleItem[];
  /** Name of the list displayed in the undo message (default: "Watchlist"). */
  listName?: string;
  /**
   * Called exactly once when a removal finalizes (undo window elapsed).
   * This is the integration seam — a future story wires this to persistence.
   */
  onRemoveVehicle?: (vin: string) => void;
  /** Undo window duration in ms (default: 30 000). */
  undoWindowMs?: number;
}

// ─── Component ──────────────────────────────────────────────────────────────

/**
 * Client-interactive watchlist list with optimistic remove + inline undo.
 *
 * Renders from the `useRemovableList` hook so the UI reflects
 * removals/restorations immediately. Each card's ⋯ menu includes a
 * destructive "Remove from list" item. On remove, the card slot is replaced
 * by an inline undo row that auto-dismisses after the configurable timeout.
 *
 * Accessibility:
 * - An `aria-live="polite"` region announces removals/restorations to AT.
 * - The Undo button is keyboard-focusable.
 * - The destructive menu item reads as destructive via data-variant.
 */
export function WatchlistList({
  items,
  listName = "Watchlist",
  onRemoveVehicle,
  undoWindowMs,
}: WatchlistListProps) {
  const { visibleItems, pendingRemovals, removeVehicle, undoRemoval } =
    useRemovableList<WatchlistVehicleItem>({
      items,
      undoWindowMs,
      onRemoveVehicle,
    });

  // State-driven announcement so the live region re-renders for AT.
  const [announcement, setAnnouncement] = useState("");

  // Build a merged render list: visible cards + undo rows at original indices.
  const renderSlots = buildRenderSlots(visibleItems, pendingRemovals);

  const handleRemove = (vin: string, title: string) => {
    removeVehicle(vin);
    setAnnouncement(`${title} was removed from your ${listName}. Press Undo to restore.`);
  };

  const handleUndo = (vin: string, title: string) => {
    undoRemoval(vin);
    setAnnouncement(`${title} was restored to your ${listName}.`);
  };

  return (
    <div className="col-span-full flex flex-col">
      {/* Accessibility: live region for AT announcements */}
      <div aria-atomic="true" aria-live="polite" className="sr-only" role="status">
        {announcement}
      </div>

      {renderSlots.map((slot, index) => {
        const showDivider = index > 0;

        if (slot.type === "card") {
          const { cardProps, vin, title } = slot.item;
          return (
            <div key={vin}>
              {showDivider && <Separator className="my-6" />}
              <WatchlistCard
                {...cardProps}
                overflowItems={buildOverflowItems(() => handleRemove(vin, title))}
              />
            </div>
          );
        }

        // Undo row
        const { item } = slot;
        return (
          <div key={`undo-${item.vin}`}>
            {showDivider && <Separator className="my-6" />}
            <WatchlistUndoRow
              imageAlt={item.imageAlt}
              imageSrc={item.imageSrc}
              listName={listName}
              onUndo={() => handleUndo(item.vin, item.title)}
              title={item.title}
            />
          </div>
        );
      })}
    </div>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

type RenderSlot<
  T extends RemovableItem & { cardProps: Omit<WatchlistCardProps, "overflowItems"> },
> = { type: "card"; item: T } | { type: "undo"; item: T };

/**
 * Merges visible items and pending undo rows into a single ordered list.
 * Undo rows are inserted at their original indices to maintain spatial stability.
 */
function buildRenderSlots<
  T extends RemovableItem & { cardProps: Omit<WatchlistCardProps, "overflowItems"> },
>(
  visibleItems: T[],
  pendingRemovals: Map<string, { item: T; originalIndex: number }>
): RenderSlot<T>[] {
  // Build card slots.
  const cardSlots: RenderSlot<T>[] = visibleItems.map((item) => ({
    type: "card",
    item,
  }));

  // Build undo slots sorted by original index.
  const undoEntries = Array.from(pendingRemovals.entries())
    .map(([, { item, originalIndex }]) => ({ item, originalIndex }))
    .sort((a, b) => a.originalIndex - b.originalIndex);

  // Insert undo rows at their original positions.
  const slots = [...cardSlots];
  for (const { item, originalIndex } of undoEntries) {
    const insertAt = Math.min(originalIndex, slots.length);
    slots.splice(insertAt, 0, { type: "undo", item });
  }

  return slots;
}

/**
 * Builds the overflow menu items array with the standard actions.
 * "Remove from list" is the destructive action wired to the remove callback.
 */
function buildOverflowItems(onRemove: () => void) {
  return [
    { key: "add-note", label: "Add a note", icon: IconEdit },
    { key: "move", label: "Move to another list", icon: IconSwitch },
    {
      key: "remove",
      label: "Remove from list",
      variant: "destructive" as const,
      icon: IconClose,
      onSelect: onRemove,
    },
  ];
}
