import type {
  LifetimePreferences as SdkLifetimePreferences,
  LifetimePreferencesPatchRequest as SdkLifetimePreferencesPatchRequest,
  PreferenceWeights as SdkPreferenceWeights,
  SearchPreferences as SdkSearchPreferences,
  SearchPreferencesPatchRequest as SdkSearchPreferencesPatchRequest,
} from "@ucmp/sdk-visitor-profile-api";
import { z } from "zod";

/**
 * SDK type re-exports — canonical shapes from the generated visitor profile API.
 */
export type LifetimePreferences = SdkLifetimePreferences;
export type SearchPreferences = SdkSearchPreferences;
export type PreferenceWeights = SdkPreferenceWeights;
export type LifetimePreferencesPatchRequest = SdkLifetimePreferencesPatchRequest;
export type SearchPreferencesPatchRequest = SdkSearchPreferencesPatchRequest;

/**
 * Runtime validation for lifetime preferences response (envelope → data).
 * Validates only the required field; optional fields pass through.
 */
export const lifetimePreferencesSchema = z
  .object({
    visitorId: z.uuid(),
  })
  .passthrough();

/**
 * Runtime validation for search-scoped preferences response.
 */
export const searchPreferencesSchema = z
  .object({
    visitorId: z.uuid(),
    searchId: z.uuid(),
  })
  .passthrough();

/**
 * Runtime validation for lifetime preferences PATCH request body.
 * Structural validation only — the upstream enforces the "at least one
 * required field" constraint. The BFF validates shape, not business rules.
 */
export const lifetimePreferencesPatchSchema = z.object({
  preferences: z.record(z.string(), z.record(z.string(), z.number())).optional(),
  rawWeightsByDate: z
    .record(z.string(), z.record(z.string(), z.record(z.string(), z.number())))
    .optional(),
  totalSessions: z.number().int().nonnegative().optional(),
  totalSearches: z.number().int().nonnegative().optional(),
  totalVehicleViews: z.number().int().nonnegative().optional(),
  computedAt: z.string().optional(),
  algorithmVersion: z.string().max(50).optional(),
});

/**
 * Runtime validation for search preferences PATCH request body.
 */
export const searchPreferencesPatchSchema = z.object({
  preferences: z.record(z.string(), z.record(z.string(), z.number())).optional(),
  location: z
    .object({
      zipCode: z.string(),
      latitude: z.number(),
      longitude: z.number(),
    })
    .passthrough()
    .optional(),
  computedAt: z.string().optional(),
});
