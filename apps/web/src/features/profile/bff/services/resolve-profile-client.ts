import "client-only";

import type { ResolvedVisitor } from "@features/profile/bff";
import type { ResolveResponse } from "@ucmp/sdk-visitor-profile-api";

export interface ResolveProfileClientOptions {
  fpHash?: string;
  signal?: AbortSignal;
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

function isProfileResolveResponse(value: unknown): value is ResolveResponse {
  if (!isRecord(value)) {
    return false;
  }

  const { data, meta } = value;

  if (!isRecord(meta)) {
    return false;
  }

  return (
    isResolvedVisitor(data) &&
    typeof meta.traceId === "string" &&
    typeof meta.timestamp === "string"
  );
}

export async function resolveProfile(
  options: ResolveProfileClientOptions = {}
): Promise<ResolvedVisitor> {
  const url = new URL("/api/v1/profile/resolve", window.location.origin);

  if (options.fpHash) {
    url.searchParams.set("fpHash", options.fpHash);
  }

  const response = await fetch(url, {
    method: "GET",
    credentials: "include",
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(`Profile resolve failed with status ${response.status}`);
  }

  const payload: unknown = await response.json();

  if (!isProfileResolveResponse(payload)) {
    throw new Error("Profile resolve returned an invalid response shape");
  }

  return payload.data;
}
