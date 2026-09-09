import "client-only";

import { API_ROUTES } from "@config/routes";
import { createHttpClient } from "@shared/lib/http/client-api";
import type { SearchSession, UpdateSearchRequest } from "@ucmp/sdk-visitor-profile-api";

const client = createHttpClient({}, {}, {});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractSessions(payload: unknown): SearchSession[] {
  if (!(isRecord(payload) && Array.isArray(payload.data))) {
    throw new Error("Invalid searches response shape");
  }
  return payload.data as SearchSession[];
}

function extractSession(payload: unknown): SearchSession {
  if (!(isRecord(payload) && isRecord(payload.data))) {
    throw new Error("Invalid search session response shape");
  }
  return payload.data as unknown as SearchSession;
}

/**
 * GET /api/v1/profile/searches — list visitor's search sessions.
 */
export async function fetchSearchesClient(signal?: AbortSignal): Promise<SearchSession[]> {
  return extractSessions(await client.get(API_ROUTES.SEARCHES, { signal }));
}

/**
 * PATCH /api/v1/profile/searches/{searchId} — update search session.
 */
export async function updateSearchClient(
  searchId: string,
  request: UpdateSearchRequest,
  signal?: AbortSignal
): Promise<SearchSession> {
  return extractSession(await client.patch(API_ROUTES.searchesById(searchId), request, { signal }));
}
