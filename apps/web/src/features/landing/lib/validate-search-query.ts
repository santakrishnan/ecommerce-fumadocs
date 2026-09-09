import { z } from "zod";

export const MAX_QUERY_LENGTH = 4000;

const UNSAFE_PATTERNS: RegExp[] = [
  /<\s*script/i,
  /<\s*\/\s*script/i,
  /javascript\s*:/i,
  /\bon\w+\s*=/i, // inline event handlers (quoted or unquoted)
  /<\s*iframe/i,
  /<\s*object/i,
  /<\s*embed/i,
  /data\s*:\s*text\/html/i,
];

const isSafe = (value: string) => !UNSAFE_PATTERNS.some((p) => p.test(value));

export const searchQuerySchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_QUERY_LENGTH)
  .refine(isSafe, { message: "unsafe_pattern" });

export type SearchQuery = z.infer<typeof searchQuerySchema>;
