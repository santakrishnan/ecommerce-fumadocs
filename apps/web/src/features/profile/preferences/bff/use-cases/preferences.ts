import "server-only";

import { resolveBedService } from "@config/bed-services";
import { readVisitorIdentity } from "@shared/lib/http/bed-identity";
import { HTTP_STATUS_SERVICE_UNAVAILABLE } from "@shared/lib/http/status-codes";
import type {
  LifetimePreferences,
  LifetimePreferencesPatchRequest,
  SearchPreferences,
  SearchPreferencesPatchRequest,
} from "../contracts/preferences.schema";
import { createPreferencesError, type PreferencesError } from "../errors/preferences.errors";
import {
  fetchLifetimePreferences,
  fetchSearchPreferences,
  patchLifetimePreferences,
  patchSearchPreferences,
} from "../services/preferences-upstream";

export type GetLifetimePreferencesResult =
  | { success: true; data: LifetimePreferences }
  | { success: false; error: PreferencesError };

export type GetSearchPreferencesResult =
  | { success: true; data: SearchPreferences }
  | { success: false; error: PreferencesError };

export type UpdateLifetimePreferencesResult = GetLifetimePreferencesResult;
export type UpdateSearchPreferencesResult = GetSearchPreferencesResult;

const NOT_CONFIGURED = createPreferencesError(
  "InternalError",
  "Visitors upstream service is not configured (API_UPSTREAM_URL + VISITORS_API_KEY)",
  HTTP_STATUS_SERVICE_UNAVAILABLE
);

/** Use case: get visitor lifetime preferences. */
export async function getLifetimePreferences(): Promise<GetLifetimePreferencesResult> {
  const visitors = resolveBedService("visitors");
  if (!visitors) {
    return { success: false, error: NOT_CONFIGURED };
  }
  const identity = await readVisitorIdentity();
  return fetchLifetimePreferences(visitors, identity);
}

/** Use case: update visitor lifetime preferences (internal/aggregator). */
export async function updateLifetimePreferences(
  request: LifetimePreferencesPatchRequest
): Promise<UpdateLifetimePreferencesResult> {
  const visitors = resolveBedService("visitors");
  if (!visitors) {
    return { success: false, error: NOT_CONFIGURED };
  }
  const identity = await readVisitorIdentity();
  return patchLifetimePreferences(visitors, request, identity);
}

/** Use case: get search-scoped preferences. */
export async function getSearchPreferences(searchId: string): Promise<GetSearchPreferencesResult> {
  const visitors = resolveBedService("visitors");
  if (!visitors) {
    return { success: false, error: NOT_CONFIGURED };
  }
  const identity = await readVisitorIdentity();
  return fetchSearchPreferences(visitors, searchId, identity);
}

/** Use case: update search-scoped preferences (internal/aggregator). */
export async function updateSearchPreferences(
  searchId: string,
  request: SearchPreferencesPatchRequest
): Promise<UpdateSearchPreferencesResult> {
  const visitors = resolveBedService("visitors");
  if (!visitors) {
    return { success: false, error: NOT_CONFIGURED };
  }
  const identity = await readVisitorIdentity();
  return patchSearchPreferences(visitors, searchId, request, identity);
}
