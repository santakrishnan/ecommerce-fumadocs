"use client";

import type { QueryClient } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { LOCATION_QUERY_KEY } from "../data/constants";
import { ELIGIBLE_ROUTES, LOCATION_DEPENDENT_QUERY_KEYS } from "../data/eligible-routes";

/** Shape of the location cache entry (zip only — no lat/lng on client). */
interface LocationCacheEntry {
  zipCode: string;
}

/** Checks whether the given pathname matches any eligible route. */
function isEligibleRoute(pathname: string): boolean {
  return ELIGIBLE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/** Invalidates all location-dependent query keys. */
function invalidateLocationQueries(queryClient: QueryClient): void {
  for (const key of LOCATION_DEPENDENT_QUERY_KEYS) {
    queryClient.invalidateQueries({ queryKey: key });
  }
}

/** Checks whether the event is a location cache update. */
function isLocationCacheUpdate(event: { type: string; query: { queryKey: unknown } }): boolean {
  if (event.type !== "updated") {
    return false;
  }
  const queryKey = event.query.queryKey;
  return Array.isArray(queryKey) && queryKey.length === 1 && queryKey[0] === LOCATION_QUERY_KEY[0];
}

/**
 * useLocationRehydration — detects React Query cache changes on the
 * ["location"] key and conditionally invalidates location-dependent
 * data queries on eligible routes.
 *
 * - Eligible route → invalidates all location-dependent query keys
 *   (causes those queries to refetch with new coordinates from cookie).
 * - Non-eligible route → no-op (only the LocationPill display updates).
 */
export function useLocationRehydration() {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const previousZipRef = useRef<string | undefined>(undefined);
  const lastInvalidatedZipRef = useRef<string | undefined>(undefined);
  const ignoreNextUpdateRef = useRef(false);

  useEffect(() => {
    // Seed the ref from the current cache so the initial setQueryData (from
    // LocationRehydrator) doesn't trigger a spurious invalidation on mount.
    const existing = queryClient.getQueryData<LocationCacheEntry>(LOCATION_QUERY_KEY);
    previousZipRef.current = existing?.zipCode;
    // If the cache is empty on mount, the next update will be the initial seed
    // from LocationRehydrator — ignore it to avoid a spurious invalidation cycle.
    ignoreNextUpdateRef.current = previousZipRef.current === undefined;

    // If the user navigated to an eligible route after changing ZIP on a
    // non-eligible route, the dependent queries may be stale. Check once on
    // pathname change and invalidate if needed.
    if (
      isEligibleRoute(pathname) &&
      existing?.zipCode &&
      lastInvalidatedZipRef.current !== existing.zipCode
    ) {
      lastInvalidatedZipRef.current = existing.zipCode;
      invalidateLocationQueries(queryClient);
    }

    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (!isLocationCacheUpdate(event)) {
        return;
      }

      const data = event.query.state.data as LocationCacheEntry | undefined;
      if (!data?.zipCode) {
        return;
      }

      // Skip the initial cache seed from LocationRehydrator.
      if (ignoreNextUpdateRef.current) {
        ignoreNextUpdateRef.current = false;
        previousZipRef.current = data.zipCode;
        return;
      }

      if (previousZipRef.current === data.zipCode) {
        return;
      }

      previousZipRef.current = data.zipCode;

      if (!isEligibleRoute(pathname)) {
        return;
      }

      lastInvalidatedZipRef.current = data.zipCode;
      invalidateLocationQueries(queryClient);
    });

    return () => unsubscribe();
  }, [queryClient, pathname]);
}
