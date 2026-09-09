import type {
  SearchSession as SdkSearchSession,
  UpdateSearchRequest as SdkUpdateSearchRequest,
} from "@ucmp/sdk-visitor-profile-api";
import { z } from "zod";

/**
 * SDK type re-export — the canonical SearchSession shape.
 */
export type SearchSession = SdkSearchSession;

/**
 * SDK type re-export — the canonical UpdateSearchRequest shape.
 */
export type UpdateSearchRequest = SdkUpdateSearchRequest;

/**
 * Runtime validation schema for SearchSession (used for upstream response parsing).
 * Mirrors the SDK type but provides Zod validation.
 */
export const searchSessionSchema = z.object({
  searchId: z.string().uuid(),
  name: z.string().max(200).optional().nullable(),
  query: z.string().max(500).optional().nullable(),
  filters: z
    .array(
      z.object({
        key: z.string(),
        filterType: z.string().optional(),
        value: z.union([z.string(), z.number(), z.boolean()]).optional(),
        values: z.array(z.union([z.string(), z.number()])).optional(),
        min: z.number().optional(),
        max: z.number().optional(),
        enabled: z.boolean().optional(),
      })
    )
    .optional()
    .nullable(),
  isSaved: z.boolean(),
  createdAt: z.string().optional().nullable(),
  lastActiveAt: z.string().optional().nullable(),
});

/**
 * Runtime validation for PATCH /searches/{searchId} request body.
 * Only provided fields are updated; omitted fields remain unchanged.
 */
export const updateSearchRequestSchema = z.object({
  /** Pin (true) or unpin (false) the search. */
  isSaved: z.boolean().optional(),
  /** Custom label for the saved search (e.g. "SUVs under $35k"). */
  name: z.string().max(200).optional(),
});
