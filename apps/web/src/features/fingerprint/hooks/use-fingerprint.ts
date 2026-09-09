"use client";

import { DEFAULT_ZIP_CODE, LOCATION_QUERY_KEY } from "@features/location";
import { useVisitorData } from "@fingerprint/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TRACKING_TTL } from "@ucmp/shared/constants";
import { createContext, use } from "react";
import type { EnrichResponse, FingerprintSessionResponse } from "../bff/contracts/enrich.schema";
import {
  FINGERPRINT_GEO_QUERY_KEY,
  FINGERPRINT_QUERY_KEY,
  FINGERPRINT_SESSION_QUERY_KEY,
  HAS_FINGERPRINT_KEY,
} from "../constants";
import { enrichFingerprintClient, fetchFingerprintSession } from "../services/fingerprint-client";
import type { FingerprintContextValue } from "../types";

/**
 * All client hooks for the fingerprint feature.
 *
 * - The three **seams** (`useFingerprintSession`, `useFingerprintIdentity`,
 *   `useFingerprintEnrich`) are internal — orchestrated by
 *   `FingerprintContextProvider`.
 * - `useFingerprint` is the public consumer hook.
 *
 * The context lives here (not in the provider) so the consumer hook and the
 * provider both depend on this file, with no circular import.
 */

// ─── Context ─────────────────────────────────────────────────────────

export const FingerprintContext = createContext<FingerprintContextValue | null>(null);

// ─── Seams (internal) ────────────────────────────────────────────────

/**
 * Server-authoritative fingerprint session.
 *
 * Reads the httpOnly verified-id / geo cookies **server-side** and returns the
 * result, so the client can decide cold vs warm and hydrate context without
 * ever reading a cookie in the browser.
 *
 * Warm path also seeds the `["location"]` slice (only when empty) — without
 * this, a visitor whose ZIP cookie is gone but whose fingerprint session is
 * still valid would be stuck on the pill skeleton: enrich never fires on the
 * warm path, so nothing else would resolve a location.
 */
export function useFingerprintSession() {
  const queryClient = useQueryClient();

  return useQuery<FingerprintSessionResponse>({
    queryKey: [...FINGERPRINT_SESSION_QUERY_KEY],
    queryFn: async () => {
      const session = await fetchFingerprintSession();
      if (session.zip) {
        const existing = queryClient.getQueryData<{ zipCode: string }>(LOCATION_QUERY_KEY);
        if (!existing?.zipCode) {
          queryClient.setQueryData(LOCATION_QUERY_KEY, { zipCode: session.zip });
        }
      }
      return session;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

/**
 * Fingerprint SDK seam — runs the browser identification agent **only on a cold
 * visit** (when the server session reports no verified id) and surfaces the
 * fresh `requestId` that drives server-side enrichment.
 *
 * No cookie is read or written here: the 24h gate is the server's httpOnly
 * verified-id cookie, surfaced via `useFingerprintSession`. This is the only FP
 * SDK consumer in the decoupled flow.
 *
 * @param enabled run the SDK (true only when cold and the key is configured).
 */
export function useFingerprintIdentity(enabled: boolean) {
  const { getData } = useVisitorData({ immediate: false });

  return useQuery<{ requestId: string }>({
    queryKey: [...FINGERPRINT_QUERY_KEY],
    enabled: enabled && HAS_FINGERPRINT_KEY,
    queryFn: async () => {
      // v4 agent returns snake_case fields; `event_id` is what the server
      // Events API (`getEvent`) consumes — our internal name for it is `requestId`.
      const data = await getData();
      return { requestId: data.event_id };
    },
    staleTime: TRACKING_TTL.FINGERPRINT * 1000,
    gcTime: TRACKING_TTL.FINGERPRINT * 1000,
    retry: 1,
  });
}

/**
 * Fingerprint enrichment seam — cold-only.
 *
 * Fires once per cold fingerprint (when a fresh `requestId` exists), calls
 * `/fingerprint/enrich` (which server-side sets the httpOnly verified-id + geo
 * cookies), and returns `{ visitorId, zip, coordinates }`. Seeds the shared
 * `["location"]` slice with the resolved zip so the LocationPill reflects it
 * without a refresh. Disabled on the warm path (session already has the data).
 *
 * Enrich is the *terminal* resolver of the cold chain: when it completes
 * without a zip (fingerprint event had no postal code), it seeds the default
 * instead — the pill must never sit on its skeleton after resolution ends.
 */
export function useFingerprintEnrich(requestId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useQuery<EnrichResponse>({
    queryKey: [...FINGERPRINT_GEO_QUERY_KEY, requestId ?? null],
    enabled: Boolean(requestId),
    staleTime: Number.POSITIVE_INFINITY,
    queryFn: async () => {
      const enriched = await enrichFingerprintClient(requestId as string);
      const existing = queryClient.getQueryData<{ zipCode: string }>(LOCATION_QUERY_KEY);
      if (!existing?.zipCode) {
        queryClient.setQueryData(LOCATION_QUERY_KEY, {
          zipCode: enriched.zip ?? DEFAULT_ZIP_CODE,
        });
      }
      return enriched;
    },
  });
}

// ─── Consumer hook ───────────────────────────────────────────────────

/**
 * Consume the fingerprint context (device id + geo).
 * Must be used within a `FingerprintContextProvider`.
 */
export function useFingerprint(): FingerprintContextValue {
  const context = use(FingerprintContext);
  if (!context) {
    throw new Error("useFingerprint must be used within a FingerprintContextProvider");
  }
  return context;
}
