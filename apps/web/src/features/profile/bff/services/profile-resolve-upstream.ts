import "server-only";

import { type ResolvedBedService, VISITORS_ENDPOINTS } from "@config/bed-services";
import { type BedVisitorIdentity, createBedClient } from "@shared/lib/http/bed-client";
import { sha256Hex } from "@shared/lib/http/hash";
import { HTTP_STATUS_BAD_GATEWAY } from "@shared/lib/http/status-codes";
import type { ResolvedVisitor } from "../contracts/profile-resolve-response";
import {
  createProfileError,
  mapCaughtToProfileError,
  type ProfileError,
} from "../errors/profile.errors";

type FetchProfileResolveResult =
  | { success: true; data: ResolvedVisitor }
  | { success: false; error: ProfileError };

/**
 * Request body for `POST /visitors/v1/resolve`. Only `deviceFingerprintHash`
 * is required; `userAgent` / `referrer` / `utm` are optional enrichment the
 * caller can thread from the incoming request (see the follow-up in the story).
 */
export interface ProfileResolveRequest {
  deviceFingerprintHash: string;
  referrer?: string;
  userAgent?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isResolvedVisitor(value: unknown): value is ResolvedVisitor {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.visitorId === "string" &&
    typeof value.sessionId === "string" &&
    typeof value.deviceId === "string" &&
    typeof value.isNew === "boolean" &&
    isOptionalString(value.customerId) &&
    isOptionalString(value.firstSeenAt) &&
    isOptionalString(value.lastSeenAt)
  );
}

export async function fetchProfileResolve(
  service: ResolvedBedService,
  fingerprintId: string,
  identity?: BedVisitorIdentity
): Promise<FetchProfileResolveResult> {
  const client = createBedClient(service, identity);

  // The Visitor Profile Service identifies a device by the SHA-256 hash of the
  // raw fingerprint id, never the raw value itself. Hash at this boundary so the
  // reversible id stays server-side and only the opaque token crosses the wire.
  const deviceFingerprintHash = await sha256Hex(fingerprintId);
  const requestBody: ProfileResolveRequest = { deviceFingerprintHash };

  try {
    const raw = await client.post(VISITORS_ENDPOINTS.resolve, requestBody);

    if (!isRecord(raw)) {
      return {
        success: false,
        error: createProfileError(
          "PROFILE_UPSTREAM_ERROR",
          "Upstream returned an unexpected response shape",
          HTTP_STATUS_BAD_GATEWAY
        ),
      };
    }

    const { data } = raw;

    if (!isResolvedVisitor(data)) {
      return {
        success: false,
        error: createProfileError(
          "PROFILE_UPSTREAM_ERROR",
          "Upstream returned an unexpected response shape",
          HTTP_STATUS_BAD_GATEWAY
        ),
      };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: mapCaughtToProfileError(error) };
  }
}
