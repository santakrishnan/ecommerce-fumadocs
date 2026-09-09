"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { LOCATION_QUERY_KEY } from "../data/constants";
import { useLocationRehydration } from "../hooks/use-location-rehydration";

interface LocationRehydratorProps {
  /**
   * Server-read cookie zip. Absent on a first visit (no cookie yet) — then
   * seeding is skipped so the fingerprint enrich seed can land in the empty
   * slice. Never pass a display default here.
   */
  zipCode?: string;
}

/**
 * Invisible client island that wires location changes to React Query.
 *
 * Render-boundary contract:
 * - Renders nothing (returns `null`) — no UI of its own.
 * - The visible LocationPill stays a Server Component subtree.
 * - This component only carries the React Query orchestration logic.
 *
 * Behavior:
 * 1. Seeds `["location"]` with the server-read cookie zip when one exists —
 *    on mount and on every re-render where `zipCode` changes (e.g. after
 *    `router.refresh()`). First visits seed nothing; the fingerprint enrich
 *    flow owns the initial seed.
 * 2. `useLocationRehydration` subscribes to that key and invalidates
 *    location-dependent queries on eligible routes.
 *
 * Privacy: only `{ zipCode }` lives in the cache — never lat/lng.
 */
export function LocationRehydrator({ zipCode }: LocationRehydratorProps) {
  const queryClient = useQueryClient();

  useLocationRehydration();

  useEffect(() => {
    // No cookie yet (first visit) → leave the slice empty for the
    // fingerprint seed. An absent value must never overwrite a seeded slice.
    if (!zipCode) {
      return;
    }
    const existing = queryClient.getQueryData<{ zipCode: string }>(LOCATION_QUERY_KEY);
    if (existing?.zipCode !== zipCode) {
      queryClient.setQueryData(LOCATION_QUERY_KEY, { zipCode });
    }
  }, [queryClient, zipCode]);

  return null;
}
