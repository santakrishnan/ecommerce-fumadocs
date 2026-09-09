import "server-only";

import { PREFERENCES_ENDPOINTS, type ResolvedBedService } from "@config/bed-services";
import { type BedVisitorIdentity, createBedClient } from "@shared/lib/http/bed-client";
import { HTTP_STATUS_BAD_GATEWAY } from "@shared/lib/http/status-codes";
import { z } from "zod";
import type {
  LifetimePreferences,
  LifetimePreferencesPatchRequest,
  SearchPreferences,
  SearchPreferencesPatchRequest,
} from "../contracts/preferences.schema";
import {
  lifetimePreferencesSchema,
  searchPreferencesSchema,
} from "../contracts/preferences.schema";
import {
  createPreferencesError,
  mapCaughtToPreferencesError,
  type PreferencesError,
} from "../errors/preferences.errors";

type LifetimeResult =
  | { success: true; data: LifetimePreferences }
  | { success: false; error: PreferencesError };

type SearchResult =
  | { success: true; data: SearchPreferences }
  | { success: false; error: PreferencesError };

/** Validates the `{ data }` envelope and extracts the inner object. */
const lifetimeEnvelopeSchema = z.object({ data: lifetimePreferencesSchema });
const searchEnvelopeSchema = z.object({ data: searchPreferencesSchema });

const UNEXPECTED_SHAPE = createPreferencesError(
  "InternalError",
  "Upstream returned an unexpected response shape",
  HTTP_STATUS_BAD_GATEWAY
);

/**
 * GET /preferences — lifetime preferences.
 */
export async function fetchLifetimePreferences(
  service: ResolvedBedService,
  identity?: BedVisitorIdentity
): Promise<LifetimeResult> {
  const client = createBedClient(service, identity);
  try {
    const raw = await client.get(PREFERENCES_ENDPOINTS.lifetime);
    const parsed = lifetimeEnvelopeSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: UNEXPECTED_SHAPE };
    }
    return { success: true, data: parsed.data.data as unknown as LifetimePreferences };
  } catch (error) {
    return { success: false, error: mapCaughtToPreferencesError(error) };
  }
}

/**
 * PATCH /preferences — update lifetime preferences (internal/aggregator).
 */
export async function patchLifetimePreferences(
  service: ResolvedBedService,
  request: LifetimePreferencesPatchRequest,
  identity?: BedVisitorIdentity
): Promise<LifetimeResult> {
  const client = createBedClient(service, identity);
  try {
    const raw = await client.patch(PREFERENCES_ENDPOINTS.lifetime, request);
    const parsed = lifetimeEnvelopeSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: UNEXPECTED_SHAPE };
    }
    return { success: true, data: parsed.data.data as unknown as LifetimePreferences };
  } catch (error) {
    return { success: false, error: mapCaughtToPreferencesError(error) };
  }
}

/**
 * GET /preferences/search/{searchId} — search-scoped preferences.
 */
export async function fetchSearchPreferences(
  service: ResolvedBedService,
  searchId: string,
  identity?: BedVisitorIdentity
): Promise<SearchResult> {
  const client = createBedClient(service, identity);
  try {
    const raw = await client.get(PREFERENCES_ENDPOINTS.bySearchId(searchId));
    const parsed = searchEnvelopeSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: UNEXPECTED_SHAPE };
    }
    return { success: true, data: parsed.data.data as unknown as SearchPreferences };
  } catch (error) {
    return { success: false, error: mapCaughtToPreferencesError(error) };
  }
}

/**
 * PATCH /preferences/search/{searchId} — update search-scoped preferences (internal/aggregator).
 */
export async function patchSearchPreferences(
  service: ResolvedBedService,
  searchId: string,
  request: SearchPreferencesPatchRequest,
  identity?: BedVisitorIdentity
): Promise<SearchResult> {
  const client = createBedClient(service, identity);
  try {
    const raw = await client.patch(PREFERENCES_ENDPOINTS.bySearchId(searchId), request);
    const parsed = searchEnvelopeSchema.safeParse(raw);
    if (!parsed.success) {
      return { success: false, error: UNEXPECTED_SHAPE };
    }
    return { success: true, data: parsed.data.data as unknown as SearchPreferences };
  } catch (error) {
    return { success: false, error: mapCaughtToPreferencesError(error) };
  }
}
