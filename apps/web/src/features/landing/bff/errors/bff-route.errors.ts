import { z } from "zod";

/** Generic BFF error envelope shared across all vehicle-related route handlers. */
export const bffRouteErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export type BffRouteError = z.infer<typeof bffRouteErrorSchema>;

/**
 * Type guard to check if a response is a BffRouteError.
 */
export function isBffRouteError(value: unknown): value is BffRouteError {
  return bffRouteErrorSchema.safeParse(value).success;
}
