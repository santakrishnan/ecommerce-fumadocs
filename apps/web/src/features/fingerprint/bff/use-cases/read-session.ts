import "server-only";

import { geoCookieOptions, zipCookieOptions } from "@config/cookies";
import { parseGeoCookie } from "@features/location/server";
import { cookies } from "next/headers";
import { FINGERPRINT_ID_COOKIE } from "../../constants";
import type { Coordinates, FingerprintSessionResponse } from "../contracts/enrich.schema";
import { decodeVisitorId } from "../fingerprint-cookie";

function readCoordinates(geoRaw: string | undefined): Coordinates | undefined {
  const parsed = parseGeoCookie(geoRaw);
  return parsed ? { lat: parsed.latitude, lng: parsed.longitude } : undefined;
}

/**
 * Server-authoritative fingerprint session, derived from the httpOnly cookies.
 *
 * The client calls this (via `GET /api/v1/fingerprint/session`) to decide cold
 * vs warm and to hydrate the context — without ever reading a cookie itself.
 */
export async function readFingerprintSession(): Promise<FingerprintSessionResponse> {
  const cookieStore = await cookies();

  const idToken = cookieStore.get(FINGERPRINT_ID_COOKIE)?.value;
  const visitorId = idToken ? (decodeVisitorId(idToken) ?? undefined) : undefined;

  const zip = cookieStore.get(zipCookieOptions.name)?.value || undefined;
  const coordinates = readCoordinates(cookieStore.get(geoCookieOptions.name)?.value);

  return {
    hasFingerprint: Boolean(visitorId),
    visitorId,
    zip,
    coordinates,
  };
}
