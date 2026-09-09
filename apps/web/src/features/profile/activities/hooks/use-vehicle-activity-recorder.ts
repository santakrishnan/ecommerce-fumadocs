"use client";

import type { AnonymousActivityEvent } from "@features/profile/activities/actions/record-vehicle-activity";
import { recordVehicleActivityAction } from "@features/profile/activities/actions/record-vehicle-activity";
import type { PageSource } from "@ucmp/sdk-visitor-profile-api";

export interface VehicleActivityRef {
  listPrice?: number;
  make?: string;
  mileage?: number;
  model?: string;
  title: string;
  trim?: string;
  vin: string;
  year?: number;
}

/**
 * Returns true when a vehicle object has the minimum data required to record
 * any activity event: a non-empty VIN (the upstream also validates the
 * ISO 3779 17-char pattern) and a non-empty title.
 *
 * Use this guard before building a VehicleActivityRef payload to avoid
 * sending events that will be silently rejected by the Server Action's Zod
 * validation or by the upstream service.
 */
export function hasRequiredActivityData(
  vehicle: Partial<VehicleActivityRef>
): vehicle is VehicleActivityRef {
  return (
    typeof vehicle.vin === "string" &&
    vehicle.vin.length > 0 &&
    typeof vehicle.title === "string" &&
    vehicle.title.length > 0
  );
}

/**
 * Shared hook that exposes fire-and-forget recorders for the four vehicle
 * activity events: clicked, viewed, bookmarked, unbookmarked.
 *
 * Each call delegates to a Server Action — identity is read from httpOnly
 * cookies on the server, so no visitorId/sessionId is ever sent from the
 * browser. The Server Action guards on identity resolution before
 * forwarding to the upstream. Failures are silently swallowed so
 * they never block the underlying navigation or save action.
 */
export function useVehicleActivityRecorder() {
  function recordClicked(vehicle: VehicleActivityRef, source: PageSource, position?: number) {
    const event: AnonymousActivityEvent = {
      type: "visitorActivity.vehicle.clicked",
      vehicle,
      source,
      ...(position === undefined ? {} : { position }),
    };
    recordVehicleActivityAction(event).catch(() => {
      // fire-and-forget — failure must not block navigation
    });
  }

  function recordViewed(vehicle: VehicleActivityRef, source?: PageSource) {
    const event: AnonymousActivityEvent = {
      type: "visitorActivity.vehicle.viewed",
      vehicle,
      ...(source === undefined ? {} : { source }),
    };
    recordVehicleActivityAction(event).catch(() => {
      // fire-and-forget
    });
  }

  function recordBookmarked(vehicle: VehicleActivityRef, source?: PageSource) {
    const event: AnonymousActivityEvent = {
      type: "visitorActivity.vehicle.bookmarked",
      vehicle,
      ...(source === undefined ? {} : { source }),
    };
    recordVehicleActivityAction(event).catch(() => {
      // fire-and-forget
    });
  }

  function recordUnbookmarked(vehicle: Pick<VehicleActivityRef, "vin" | "title">) {
    const event: AnonymousActivityEvent = {
      type: "visitorActivity.vehicle.unbookmarked",
      vehicle,
    };
    recordVehicleActivityAction(event).catch(() => {
      // fire-and-forget
    });
  }

  return { recordClicked, recordViewed, recordBookmarked, recordUnbookmarked };
}
