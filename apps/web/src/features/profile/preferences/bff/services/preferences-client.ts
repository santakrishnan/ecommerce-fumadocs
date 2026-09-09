import "client-only";

import { API_ROUTES } from "@config/routes";
import { createHttpClient } from "@shared/lib/http/client-api";
import type {
  LifetimePreferences,
  LifetimePreferencesPatchRequest,
  SearchPreferences,
  SearchPreferencesPatchRequest,
} from "@ucmp/sdk-visitor-profile-api";

const client = createHttpClient({}, {}, {});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractData<T>(payload: unknown): T {
  if (!(isRecord(payload) && isRecord(payload.data))) {
    throw new Error("Invalid preferences response shape");
  }
  return payload.data as T;
}

/** GET /api/v1/profile/preferences — lifetime preferences. */
export async function fetchLifetimePreferencesClient(
  signal?: AbortSignal
): Promise<LifetimePreferences> {
  return extractData<LifetimePreferences>(await client.get(API_ROUTES.PREFERENCES, { signal }));
}

/** PATCH /api/v1/profile/preferences — update lifetime preferences. */
export async function updateLifetimePreferencesClient(
  request: LifetimePreferencesPatchRequest,
  signal?: AbortSignal
): Promise<LifetimePreferences> {
  return extractData<LifetimePreferences>(
    await client.patch(API_ROUTES.PREFERENCES, request, { signal })
  );
}

/** GET /api/v1/profile/preferences/search/{searchId} — search-scoped preferences. */
export async function fetchSearchPreferencesClient(
  searchId: string,
  signal?: AbortSignal
): Promise<SearchPreferences> {
  return extractData<SearchPreferences>(
    await client.get(API_ROUTES.preferencesBySearchId(searchId), { signal })
  );
}

/** PATCH /api/v1/profile/preferences/search/{searchId} — update search preferences. */
export async function updateSearchPreferencesClient(
  searchId: string,
  request: SearchPreferencesPatchRequest,
  signal?: AbortSignal
): Promise<SearchPreferences> {
  return extractData<SearchPreferences>(
    await client.patch(API_ROUTES.preferencesBySearchId(searchId), request, { signal })
  );
}
