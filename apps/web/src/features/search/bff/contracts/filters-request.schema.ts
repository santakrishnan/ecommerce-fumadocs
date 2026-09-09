import type {
  FiltersRequest as SdkFiltersRequest,
  Location as SdkLocation,
} from "@ucmp/sdk-search-api";
import { z } from "zod";

/**
 * Location validation schema. Kept for runtime validation at the BFF boundary;
 * `satisfies z.ZodType<SdkLocation>` enforces conformance with the SDK `Location`
 * type so the two stay in lockstep.
 */
const locationSchema = z.object({
  zipCode: z.string().min(1),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
}) satisfies z.ZodType<SdkLocation>;

/**
 * Client-facing request schema — strict, validated at the BFF boundary.
 * Keep this schema for runtime validation — do NOT replace with a plain type.
 */
export const FiltersRequestSchema = z.object({
  location: locationSchema,
  searchId: z.string().uuid().optional(),
});

/**
 * Alias of SDK FiltersRequest — sourced from the SDK barrel so this type and the
 * API wire contract stay in lockstep.
 */
export type FiltersRequest = SdkFiltersRequest;

/**
 * Upstream request schema — loose, mirrors the upstream OpenAPI surface.
 */
export const FiltersUpstreamRequestSchema = z.object({
  location: z
    .object({
      zipCode: z.string(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    .passthrough(),
  searchId: z.string().optional(),
});

export type FiltersUpstreamRequest = z.infer<typeof FiltersUpstreamRequestSchema>;
