import { locationCookieNames } from "@config/cookies";
import { cookies } from "next/headers";
import { LocationPill } from "./location-pill";
import { LocationRehydrator } from "./location-rehydrator";

/**
 * Async leaf that reads the ZIP cookie and renders LocationPill.
 * Must be wrapped in <Suspense> at the call site to prevent blocking the static shell.
 *
 * Passes the *raw* cookie value (no display default) to both children:
 * - LocationPill renders a skeleton until a real location exists — first
 *   visits show the skeleton, then the fingerprint-detected zip.
 * - LocationRehydrator must never seed the context with a default; the
 *   fingerprint enrich seed's "only when empty" guard depends on the slice
 *   staying empty until a genuine location exists.
 */
export async function LocationPillWrapper() {
  const cookieStore = await cookies();
  const cookieZip = cookieStore.get(locationCookieNames.ZIP)?.value;
  return (
    <>
      <LocationPill zipCode={cookieZip} />
      <LocationRehydrator zipCode={cookieZip} />
    </>
  );
}
