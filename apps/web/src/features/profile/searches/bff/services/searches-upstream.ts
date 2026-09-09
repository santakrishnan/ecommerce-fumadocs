import "server-only";

import { type ResolvedBedService, SEARCHES_ENDPOINTS } from "@config/bed-services";
import { type BedVisitorIdentity, createBedClient } from "@shared/lib/http/bed-client";
import { HTTP_STATUS_BAD_GATEWAY } from "@shared/lib/http/status-codes";
import type { SearchSession, UpdateSearchRequest } from "../contracts/search-session.schema";
import { searchSessionSchema } from "../contracts/search-session.schema";
import {
  createSearchesError,
  mapCaughtToSearchesError,
  type SearchesError,
} from "../errors/searches.errors";

type SearchesListResult =
  | { success: true; data: SearchSession[] }
  | { success: false; error: SearchesError };

type SearchUpdateResult =
  | { success: true; data: SearchSession }
  | { success: false; error: SearchesError };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseSearchesEnvelope(raw: unknown): SearchSession[] | null {
  if (!isRecord(raw)) {
    return null;
  }
  const data = raw.data;
  if (!Array.isArray(data)) {
    return null;
  }
  // Validate each item against the schema — reject malformed entries
  const validated: SearchSession[] = [];
  for (const item of data) {
    const parsed = searchSessionSchema.safeParse(item);
    if (parsed.success) {
      validated.push(parsed.data as unknown as SearchSession);
    }
  }
  return validated;
}

function parseSearchSessionEnvelope(raw: unknown): SearchSession | null {
  if (!isRecord(raw)) {
    return null;
  }
  const parsed = searchSessionSchema.safeParse(raw.data);
  if (!parsed.success) {
    return null;
  }
  return parsed.data as unknown as SearchSession;
}

const UNEXPECTED_SHAPE = createSearchesError(
  "InternalError",
  "Upstream returned an unexpected response shape",
  HTTP_STATUS_BAD_GATEWAY
);

/**
 * GET /searches — list visitor's search sessions.
 */
export async function fetchSearches(
  service: ResolvedBedService,
  identity?: BedVisitorIdentity
): Promise<SearchesListResult> {
  const client = createBedClient(service, identity);
  try {
    const raw = await client.get(SEARCHES_ENDPOINTS.base);
    const data = parseSearchesEnvelope(raw);
    return data ? { success: true, data } : { success: false, error: UNEXPECTED_SHAPE };
  } catch (error) {
    return { success: false, error: mapCaughtToSearchesError(error) };
  }
}

/**
 * PATCH /searches/{searchId} — update a search session (pin/unpin, rename).
 */
export async function patchSearchSession(
  service: ResolvedBedService,
  searchId: string,
  request: UpdateSearchRequest,
  identity?: BedVisitorIdentity
): Promise<SearchUpdateResult> {
  const client = createBedClient(service, identity);
  try {
    const raw = await client.patch(SEARCHES_ENDPOINTS.byId(searchId), request);
    const data = parseSearchSessionEnvelope(raw);
    return data ? { success: true, data } : { success: false, error: UNEXPECTED_SHAPE };
  } catch (error) {
    return { success: false, error: mapCaughtToSearchesError(error) };
  }
}
