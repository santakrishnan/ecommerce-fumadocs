"use client";

import { clientEnv } from "@config/client-env";
import { DEFAULT_ZIP_CODE, LOCATION_QUERY_KEY } from "@features/location";
import { FingerprintProvider as FpSdkProvider } from "@fingerprint/react";
import { useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect } from "react";
import {
  FingerprintContext,
  useFingerprintEnrich,
  useFingerprintIdentity,
  useFingerprintSession,
} from "../hooks/use-fingerprint";
import type { FingerprintContextValue } from "../types";

/**
 * Seeds the `["location"]` slice with the default zip (only when empty).
 *
 * Mounted only in *terminal* states where no resolver will ever produce a
 * location — fingerprinting disabled (no key) or the resolution chain
 * errored. Keeps the LocationPill from sitting on its skeleton forever;
 * a cookie- or user-driven value always takes precedence.
 */
function SeedDefaultLocation() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const existing = queryClient.getQueryData<{ zipCode: string }>(LOCATION_QUERY_KEY);
    if (!existing?.zipCode) {
      queryClient.setQueryData(LOCATION_QUERY_KEY, { zipCode: DEFAULT_ZIP_CODE });
    }
  }, [queryClient]);

  return null;
}

const FINGERPRINT_API_KEY = clientEnv.NEXT_PUBLIC_FINGERPRINT_API_KEY ?? "";
const FINGERPRINT_REGION = clientEnv.NEXT_PUBLIC_FINGERPRINT_REGION;

/** Maps the env region string to the SDK region ('us' | 'eu' | 'ap'; undefined → US/Global). */
function resolveRegion(): "us" | "eu" | "ap" | undefined {
  if (FINGERPRINT_REGION === "eu") {
    return "eu";
  }
  if (FINGERPRINT_REGION === "ap") {
    return "ap";
  }
  return;
}

/** Context value when fingerprinting is disabled (no public key). */
const DISABLED_CONTEXT: FingerprintContextValue = {
  isReady: false,
  isLoading: false,
  isError: false,
  requestId: null,
};

/**
 * Inner provider — runs the three decoupled seams (session, identity, enrich)
 * and exposes their composed value. Must render inside the FP SDK provider
 * (`useFingerprintIdentity` calls `useVisitorData`).
 */
function FingerprintSeams({ children }: { children: ReactNode }) {
  const session = useFingerprintSession();

  // Cold once the session has loaded and reports no verified id — or no
  // resolved zip (e.g. the location cookies were cleared while the
  // fingerprint session stayed valid). Re-running identity + enrich
  // re-resolves geo and re-seeds the location cookies, so the pill never
  // sits on its skeleton indefinitely.
  const cold = session.data ? !(session.data.hasFingerprint && session.data.zip) : false;

  const identity = useFingerprintIdentity(cold);
  const enrich = useFingerprintEnrich(cold ? identity.data?.requestId : null);

  const fingerprintId = session.data?.visitorId ?? enrich.data?.visitorId;

  const value: FingerprintContextValue = {
    fingerprintId,
    requestId: identity.data?.requestId ?? null,
    zip: session.data?.zip ?? enrich.data?.zip,
    coordinates: session.data?.coordinates ?? enrich.data?.coordinates,
    isReady: Boolean(fingerprintId),
    isLoading: session.isLoading || (cold && (identity.isLoading || enrich.isLoading)),
    isError: session.isError || identity.isError || enrich.isError,
  };

  return (
    <FingerprintContext value={value}>
      {/* Resolution chain died — fall back so the pill leaves its skeleton. */}
      {value.isError && <SeedDefaultLocation />}
      {children}
    </FingerprintContext>
  );
}

/**
 * Single fingerprint provider.
 *
 * Boots the Fingerprint SDK (`@fingerprint/react` v3, agent v4) when a public
 * key is configured, then provides the server-authoritative device-fingerprint
 * context (id + geo) with **no client-side cookie access**. This is the only
 * fingerprint provider — it replaces the former split SDK/context providers.
 *
 * Must render inside the TanStack `QueryProvider`, and must wrap any consumer of
 * `useVisitorData` (the seams here and `ProfileProvider`).
 */
export function FingerprintProvider({ children }: { children: ReactNode }) {
  console.info(
    "[FingerprintProvider] NEXT_PUBLIC_FINGERPRINT_API_KEY:",
    FINGERPRINT_API_KEY ? `${FINGERPRINT_API_KEY.slice(0, 8)}… (set)` : "NOT SET"
  );

  if (!FINGERPRINT_API_KEY) {
    // Dev without a key: no SDK, static disabled context (no crash, no
    // network). No resolver will ever run — seed the default location so the
    // pill doesn't sit on its skeleton.
    return (
      <FingerprintContext value={DISABLED_CONTEXT}>
        <SeedDefaultLocation />
        {children}
      </FingerprintContext>
    );
  }

  return (
    <FpSdkProvider apiKey={FINGERPRINT_API_KEY} region={resolveRegion()}>
      <FingerprintSeams>{children}</FingerprintSeams>
    </FpSdkProvider>
  );
}
