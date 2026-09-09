import { TRACKING_TTL } from "@ucmp/shared/constants";
import type { HomeExperienceMode } from "./home-experience";

/**
 * Recent-return window. A return within this gap keeps the visitor on `/` with
 * the welcome body; beyond it they are redirected to `/welcome-back`.
 *
 * Single-sourced from `TRACKING_TTL.RETURNING_VISITOR_THRESHOLD` (seconds) so the
 * RSC boundary here and the edge redirect in `proxy.ts` can't drift.
 */
export const RECENT_RETURN_TTL_MS = TRACKING_TTL.RETURNING_VISITOR_THRESHOLD * 1000; // 2h

/** Server-authoritative signals from the Visitor Profile Service `/resolve`. */
export interface HomeModeSignals {
  /** Brand-new visitor (device seen for the first time). */
  isNew?: boolean;
  /** Last-activity timestamp (ISO 8601) — backend-owned. */
  lastSeenAt?: string;
}

/**
 * Derive the home experience mode from the `/resolve` signals.
 *
 * The boundary is **`now − lastSeenAt`** (time since last active), compared to
 * the 2h window — not `firstSeenAt − lastSeenAt`. A brand-new visitor (`isNew`)
 * or one with no `lastSeenAt` is `first-visit`.
 */
export function deriveHomeMode({ isNew, lastSeenAt }: HomeModeSignals): HomeExperienceMode {
  if (isNew || !lastSeenAt) {
    return "first-visit";
  }

  const lastSeenMs = Date.parse(lastSeenAt);
  if (Number.isNaN(lastSeenMs)) {
    return "first-visit";
  }

  const awayMs = Date.now() - lastSeenMs;
  return awayMs >= RECENT_RETURN_TTL_MS ? "lapsed-return" : "recent-return";
}
