"use client";

import { recordVehicleActivityAction } from "@features/profile/activities/actions/record-vehicle-activity";
import { setClickedReferrer } from "@features/profile/activities/client";
import type { PageSource } from "@ucmp/sdk-visitor-profile-api";
import { LinkInventoryCard, type LinkInventoryCardProps } from "./link-inventory-card";

export interface LinkInventoryCardClientProps extends LinkInventoryCardProps {
  /**
   * The 0-based position of this card in its containing list.
   * When provided, forwarded as the `position` field on the vehicle.clicked event.
   */
  activityPosition?: number;
  /**
   * The PageSource value for the surface where this card is rendered.
   * When provided, a `visitorActivity.vehicle.clicked` event is fired
   * via the BFF when the visitor navigates to the VDP.
   */
  activitySource?: PageSource;
}

/**
 * Client wrapper around LinkInventoryCard that records a `vehicle.clicked`
 * activity event when the visitor clicks through to the VDP.
 *
 * Uses a bubble-phase `onClick` on an outer wrapper div rather than passing
 * the handler through `linkProps`. This approach is reliable because:
 *
 * 1. SaveButton already calls `e.stopPropagation()` on its own `onClick`, so
 *    bookmark-button clicks never bubble up to this wrapper — only card-link
 *    clicks do.
 * 2. The handler fires synchronously in the bubble phase, before Next.js
 *    schedules the router transition, so `setClickedReferrer` writes to
 *    sessionStorage before the VDP mounts and RecordVehicleView runs.
 * 3. This bypasses the PolyCard → LinkCard → mergeProps → cloneElement chain
 *    entirely — no risk of handler loss in prop-merging.
 *
 * Use this variant on surfaces where click tracking is required. Server
 * Component surfaces that don't need click tracking use `LinkInventoryCard`.
 */
export function LinkInventoryCardClient({
  activityPosition,
  activitySource,
  vehicle,
  ...rest
}: LinkInventoryCardClientProps) {
  function handleClick() {
    if (!activitySource) {
      return;
    }
    const vin = vehicle.vin ?? vehicle.id;
    const title =
      `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ""}`.trim();

    // Write a timestamped flag before navigation so RecordVehicleView
    // can suppress vehicle.viewed for this visit.
    setClickedReferrer(vin);

    // Fire-and-forget — intentionally not awaited so navigation is not blocked.
    recordVehicleActivityAction({
      type: "visitorActivity.vehicle.clicked",
      vehicle: {
        vin,
        title,
        year: vehicle.year,
        make: vehicle.make,
        model: vehicle.model,
        trim: vehicle.trim,
        listPrice: vehicle.price,
        mileage: vehicle.mileage,
      },
      source: activitySource,
      ...(activityPosition === undefined ? {} : { position: activityPosition }),
    }).catch(() => {
      // fire-and-forget
    });
  }

  return (
    // Wrapper div intercepts clicks via onClickCapture (fires top-down before
    // child handlers). SaveButton already calls e.stopPropagation() on its own
    // onClick so bookmark taps never reach handleClick — only card-link clicks do.
    <div
      onClickCapture={(e) => {
        const target = e.target as HTMLElement;
        // Skip if the click target is a button or inside one (covers SaveButton,
        // dropdown triggers, and any other interactive adornments).
        if (target.closest("button")) {
          return;
        }
        handleClick();
      }}
    >
      <LinkInventoryCard {...rest} vehicle={vehicle} />
    </div>
  );
}
