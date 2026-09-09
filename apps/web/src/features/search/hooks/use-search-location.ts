"use client";

import { useFingerprint } from "@features/fingerprint";
import { DEFAULT_ZIP_CODE, LOCATION_QUERY_KEY } from "@features/location";
import { useQueryClient } from "@tanstack/react-query";
import { useSyncExternalStore } from "react";
import type { FilterLocation } from "../lib/filter-query-options";
import type { AgentSearchLocation } from "../services/agent-search-service";

/** Search location derived from the fingerprint context. */
export interface SearchLocation {
  /** Defined only when real coordinates exist; `undefined` lets callers default. */
  filterLocation: FilterLocation | undefined;
  location: AgentSearchLocation;
}

/**
 * Maps the current location to the search location shapes.
 *
 * The zip code is read from the shared `["location"]` React Query cache — the
 * single source of truth that updates immediately when the user changes their
 * ZIP via the popover. Coordinates still come from `useFingerprint()` because
 * the browser can't read the httpOnly `_ucmp_geo` cookie directly.
 */
export function useSearchLocation(): SearchLocation {
  const queryClient = useQueryClient();
  const { coordinates } = useFingerprint();

  // Subscribe to the ["location"] cache slice so the component re-renders
  // whenever the user changes their ZIP (same pattern as LocationPill).
  const cachedZip = useSyncExternalStore(
    (onStoreChange) =>
      queryClient.getQueryCache().subscribe((event) => {
        if (
          event.type === "updated" &&
          Array.isArray(event.query.queryKey) &&
          event.query.queryKey.length === 1 &&
          event.query.queryKey[0] === LOCATION_QUERY_KEY[0]
        ) {
          onStoreChange();
        }
      }),
    () => queryClient.getQueryData<{ zipCode: string }>(LOCATION_QUERY_KEY)?.zipCode ?? null,
    () => null
  );

  const zipCode = cachedZip ?? DEFAULT_ZIP_CODE;

  if (!coordinates) {
    return {
      location: { zipCode },
      filterLocation: undefined,
    };
  }

  return {
    location: {
      zipCode,
      latitude: coordinates.lat,
      longitude: coordinates.lng,
    },
    filterLocation: {
      zipCode,
      latitude: coordinates.lat,
      longitude: coordinates.lng,
    },
  };
}
