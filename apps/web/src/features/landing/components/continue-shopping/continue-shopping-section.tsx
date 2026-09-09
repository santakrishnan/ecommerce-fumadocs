import { locationCookieNames } from "@config/cookies";
import { APP_LOCATION_DEFAULTS } from "@config/location-defaults";
import { getFeaturedVehicles } from "@features/landing/services/inventory-vehicles-service";
import { parseGeoCookie } from "@features/location/lib/location-cookies";
import type { Vehicle } from "@shared/components/inventory-card";
import { devConsole } from "@shared/lib/dev-console";
import { readVisitorIdentity } from "@shared/lib/http/bed-identity";
import { cookies } from "next/headers";
import { ContinueShoppingClient } from "./continue-shopping-client";

export interface ContinueShoppingSectionProps {
  /** Outer wrapper class (e.g. carousel bleed). Applied only when content renders. */
  className?: string;
  /** Pin the group headings while the track scrolls. Defaults to true on Welcome. */
  stickyHeader?: boolean;
}

/**
 * Combined "Continue Shopping / New Today" section — async Server Component.
 *
 * Reads the ZIP + geo cookies and visitor identity outside any `"use cache"`
 * scope, then passes them to the cached `getFeaturedVehicles` service. The
 * result is handed to the client carousel, which merges it with the client
 * TanStack DB recently-viewed store.
 *
 * Returns `null` from the client carousel when both data sources are empty,
 * ensuring no wrapper element remains in the DOM.
 *
 * Wrap in `<Suspense fallback={<ContinueShoppingSkeleton />}>` at the call site
 * so the cookie read streams as a PPR hole instead of blocking the shell.
 */
export async function ContinueShoppingSection({
  className,
  stickyHeader = true,
}: ContinueShoppingSectionProps = {}) {
  const cookieStore = await cookies();
  const zipCode = cookieStore.get(locationCookieNames.ZIP)?.value ?? APP_LOCATION_DEFAULTS.zip;
  const geo = parseGeoCookie(cookieStore.get(locationCookieNames.GEO)?.value);
  const identity = await readVisitorIdentity();

  let newToday: Vehicle[] = [];
  try {
    newToday = await getFeaturedVehicles({
      zipCode,
      latitude: geo?.latitude ?? null,
      longitude: geo?.longitude ?? null,
      visitorId: identity.visitorId ?? null,
      sessionId: identity.sessionId ?? null,
    });
  } catch (error) {
    devConsole.error("[ContinueShoppingSection] Failed to load New Today", error);
  }

  return (
    <ContinueShoppingClient className={className} newToday={newToday} stickyHeader={stickyHeader} />
  );
}
