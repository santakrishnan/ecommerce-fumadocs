import "client-only";

import { API_ROUTES } from "@config/routes";
import { createHttpClient } from "@shared/lib/http/client-api";
import type { ActivityEvent } from "@ucmp/sdk-visitor-profile-api";

const client = createHttpClient({}, {}, {});

/**
 * POST /api/v1/profile/activities — record a visitor activity event.
 *
 * Fire-and-forget safe — callers can await for confirmation or ignore the
 * promise for non-critical events. The BFF injects visitorId + sessionId
 * from httpOnly cookies server-side.
 */
export async function recordActivityClient(
  event: ActivityEvent,
  signal?: AbortSignal
): Promise<void> {
  await client.post(API_ROUTES.ACTIVITIES, event, { signal });
}

/** Shape returned by the GET /api/v1/profile/activities endpoint. */
export interface ActivityLogEntry {
  id: string;
  reason?: string;
  recordedAt: string;
  status: "error" | "skipped" | "success";
  type: string;
}

/**
 * GET /api/v1/profile/activities — fetch recently recorded activities from
 * the dev ring buffer for the current visitor.
 *
 * Dev-only: the endpoint returns 404 in production, so this client will throw.
 * Pass `since` (ISO timestamp) to retrieve only entries newer than that point,
 * enabling efficient polling without re-fetching the full log each tick.
 */
export async function fetchActivityLogClient(
  since?: string,
  signal?: AbortSignal
): Promise<ActivityLogEntry[]> {
  const url = since
    ? `${API_ROUTES.ACTIVITIES}?since=${encodeURIComponent(since)}`
    : API_ROUTES.ACTIVITIES;
  const raw = await client.get(url, { signal });
  const payload = raw as { data: ActivityLogEntry[] };
  return Array.isArray(payload.data) ? payload.data : [];
}

/** Key used to signal a tracked card click to the VDP's RecordVehicleView. */
export const CLICKED_REFERRER_KEY = "ucmp_clicked_vin";

/**
 * Writes a time-stamped clicked-referrer entry to sessionStorage.
 * RecordVehicleView reads this within a short TTL to suppress vehicle.viewed
 * when the visitor arrived via a tracked card click.
 */
export function setClickedReferrer(vin: string): void {
  try {
    sessionStorage.setItem(CLICKED_REFERRER_KEY, JSON.stringify({ vin, ts: Date.now() }));
  } catch {
    // sessionStorage unavailable
  }
}

/**
 * Returns true if a card-click suppression entry exists for the given VIN
 * and is still within the 10-second TTL — indicating the visitor arrived via
 * a tracked card click and `vehicle.viewed` should be suppressed.
 *
 * Expired entries are removed on read to keep sessionStorage clean. The entry
 * is NOT removed on a successful match so the check is idempotent — React
 * Strict Mode's double effect invocation both suppress correctly without any
 * ref-based coordination. The entry will either be overwritten by the next
 * card click or expire naturally after 10 seconds.
 */
export function isVinViewSuppressed(vin: string): boolean {
  try {
    const raw = sessionStorage.getItem(CLICKED_REFERRER_KEY);
    if (!raw) {
      return false;
    }
    const entry = JSON.parse(raw) as { vin: string; ts: number };
    if (entry.vin !== vin || Date.now() - entry.ts > 10_000) {
      sessionStorage.removeItem(CLICKED_REFERRER_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}
