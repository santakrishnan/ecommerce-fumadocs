import { z } from "zod";

/** Validated client-facing request schema. */
export const searchRecentRequestSchema = z.object({});

export type SearchRecentRequest = z.infer<typeof searchRecentRequestSchema>;

/** Loose upstream request schema. */
export const searchRecentUpstreamRequestSchema = z.object({});

export type SearchRecentUpstreamRequest = z.infer<typeof searchRecentUpstreamRequestSchema>;
