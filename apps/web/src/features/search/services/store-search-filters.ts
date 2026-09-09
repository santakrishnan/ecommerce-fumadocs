"use server";

import { readLocationFromCookies } from "@features/location/server";
import { readVisitorIdentity } from "@shared/lib/http/bed-identity";
import { revalidateTag } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import type { SelectedContextFilter } from "~/features/search/bff/contracts/filters-response.schema";
import { selectedContextFilterSchema } from "~/features/search/bff/contracts/filters-response.schema";
import { contextFiltersToSmartFilters } from "~/features/search/lib/filter-converters";
import { getPaginatedResults } from "./get-paginated-results";

const COOKIE_MAX_AGE = 3600; // 1 hour — matches "search" cache profile expire time

// FilterKeySchema is a closed enum of 17 values — no session can have more than
// 17 active filter categories, so this bound is both safe and semantically correct.
const rawFiltersSchema = z.array(selectedContextFilterSchema).max(17);

// Headroom: browser cookie limit is ~4 096 bytes; 3 800 leaves space for the
// cookie name ("search-filters-<uuid>" ≈ 52 bytes) and browser metadata.
const COOKIE_MAX_BYTES = 3800;

/**
 * Persists the last agent turn's `nextSearchPlan.filters` in an httpOnly
 * cookie so the results page (`/search/[id]/results`) can hydrate its
 * initial SSR data load without encoding filters in the URL.
 *
 * Also warms the `getPaginatedResults` "use cache" entry so the results page
 * loads instantly on first click ("See all results" warm load).
 *
 * Cookie key: `search-filters-${searchId}` (one cookie per search session).
 * Call site: search-results-orchestrator whenever the last completed turn
 * changes and carries a `nextSearchPlan`.
 *
 * @param searchId   - URL `[id]` param (UUID). Used as the cookie key.
 * @param rawFilters - Raw filters array from `nextSearchPlan.filters`.
 */
export async function storeSearchFilters(
  searchId: string,
  rawFilters: SelectedContextFilter[]
): Promise<undefined> {
  if (!z.string().uuid().safeParse(searchId).success) {
    return;
  }

  // Server Actions are publicly-callable endpoints — TypeScript types are
  // erased at runtime. Validate the payload before writing it to a cookie.
  const parsed = rawFiltersSchema.safeParse(rawFilters);
  if (!parsed.success) {
    return;
  }

  // Make the size failure explicit rather than letting the browser silently
  // truncate or reject a cookie that exceeds its 4 KB limit.
  const serialized = JSON.stringify(parsed.data);
  if (serialized.length > COOKIE_MAX_BYTES) {
    // Fallback: the results page degrades gracefully — Arrow resolves the
    // search context server-side via searchId alone when the cookie is absent.
    return;
  }

  const cookieStore = await cookies();

  cookieStore.set(`search-filters-${searchId}`, serialized, {
    httpOnly: true,
    // Transmit only over HTTPS in production; allow HTTP in local dev.
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  // Bust any paginated results cached under the old filters for this session.
  revalidateTag(`search-results-${searchId}`, "max");

  // ── Prefetch warm-up ──────────────────────────────────────────────────────
  // Warm the "use cache" layer for the first page of results so the
  // "/search/[id]/results" page loads instantly when the user clicks
  // "See all results" (cache hit instead of cold API call).
  //
  // Trade-off: this fires a background search API request on every
  // storeSearchFilters call. If the user never navigates to the results page
  // the work is wasted. If that proves costly, migrate to a dedicated
  // `usePrefetchResults` hook + Server Action (mirroring `usePrefetchFilters`)
  // so the prefetch only fires when the button is actually visible.
  try {
    const identity = await readVisitorIdentity();
    const agentFilters = contextFiltersToSmartFilters(parsed.data);
    // Warm under the real location so the entry matches the SSR page's cache key.
    const location = await readLocationFromCookies();
    getPaginatedResults(searchId, agentFilters, identity, location);
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error: Identity read failed:", err);
    }
    // Best-effort — a warm-up failure must never break filter persistence.
  }
}
