import "server-only";

import { getProfileResolve } from "@features/profile";
import { TRACKING_COOKIE } from "@ucmp/shared/constants";
import { cookies } from "next/headers";
import { deriveHomeMode } from "../components/home-experience/derive-home-mode";
import type { HomeExperienceMode } from "../components/home-experience/home-experience";

const HOME_MODES: ReadonlySet<string> = new Set<HomeExperienceMode>([
  "first-visit",
  "recent-return",
  "lapsed-return",
]);

/**
 * Resolve the home experience mode for the current visitor.
 *
 * Calls the Visitor Profile Service `/resolve` (which also **extends the
 * session**) using the fingerprint identity cookie, then derives the mode from
 * the server-authoritative `isNew` / `lastSeenAt`. The decision is **cookieless**
 * — the httpOnly `_ucmp_fp_id` cookie is only resolve's input, not an activity
 * cookie.
 *
 * Falls back to `first-visit` on a cold visit (no identity yet) or any resolve
 * failure, so the home page never errors.
 *
 * DEV-only: `override` (from `?exp=`) forces a mode; ignored in production.
 */
export async function resolveHomeExperience(override?: string): Promise<HomeExperienceMode> {
  if (process.env.NODE_ENV !== "production" && override && HOME_MODES.has(override)) {
    return override as HomeExperienceMode;
  }

  const cookieStore = await cookies();
  const fpHash = cookieStore.get(TRACKING_COOKIE.FP_ID)?.value;
  if (!fpHash) {
    // Cold visit — no fingerprint identity yet. Fingerprint resolves client-side;
    // returning visits derive recent/lapsed once the identity cookie exists.
    return "first-visit";
  }

  const result = await getProfileResolve(fpHash);
  if (!result.success) {
    return "first-visit";
  }

  // The upstream response nests lastActiveAt under `stats` — map it to the
  // flat `lastSeenAt` that deriveHomeMode expects.
  const data = result.data as Record<string, unknown>;
  const stats = data.stats as Record<string, unknown> | undefined;
  const lastSeenAt =
    (data.lastSeenAt as string | undefined) ?? (stats?.lastActiveAt as string | undefined);

  const mode = deriveHomeMode({ isNew: result.data.isNew, lastSeenAt });

  // Gate: check the fresh-visit block cookie set by /demo-settings visitor generation.
  // While it is present the visitor is still blocked from recent-return, so show
  // first-visit experience. It's cleared once the visitor browses a VDP
  // (see `unblockRecentReturn`), which then lets recent-return flow through.
  if (mode === "recent-return" && cookieStore.get(TRACKING_COOKIE.RECENT_RETURN_BLOCKED)) {
    return "first-visit";
  }

  return mode;
}
