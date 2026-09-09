import { z } from "zod";

// ─── Action schemas ───────────────────────────────────────────────────────────

export const browseByStyleSeedSchema = z.object({
  categoryKey: z.string().min(1),
  label: z.string().min(1).optional(),
});

export const browseByStyleActionSchema = z.object({
  id: z.string().min(1),
  type: z.literal("navigate-to-search"),
  target: z.literal("/search"),
  seed: browseByStyleSeedSchema.optional(),
});

// ─── Card schema ──────────────────────────────────────────────────────────────

export const browseByStyleImageSchema = z.object({
  src: z.string().min(1),
  alt: z.string().min(1),
});

export const browseByStyleCtaSchema = z.object({
  label: z.string().min(1),
});

export const browseByStyleCardSchema = z.object({
  id: z.string().min(1),
  cardType: z.literal("style-category"),
  categoryKey: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  image: browseByStyleImageSchema.optional(),
  cta: browseByStyleCtaSchema.optional(),
  action: browseByStyleActionSchema,
});

// ─── Response schemas ─────────────────────────────────────────────────────────

export const browseByStyleMetaSchema = z.object({
  source: z.enum(["static", "mock"]).optional(),
});

export const browseByStyleSuccessResponseSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().optional(),
  items: z.array(browseByStyleCardSchema),
  meta: browseByStyleMetaSchema.optional(),
});

export const browseByStyleValidationErrorSchema = z.object({
  error: z.object({
    code: z.literal("BROWSE_BY_STYLE_VALIDATION_FAILED"),
    message: z.string().min(1),
    details: z.object({
      source: z.literal("getBrowseByStyleResponse"),
    }),
  }),
});

export const browseByStyleRouteResponseSchema = z.union([
  browseByStyleSuccessResponseSchema,
  browseByStyleValidationErrorSchema,
]);

// ─── Inferred types ───────────────────────────────────────────────────────────

export type BrowseByStyleCard = z.infer<typeof browseByStyleCardSchema>;
export type BrowseByStyleAction = z.infer<typeof browseByStyleActionSchema>;
export type BrowseByStyleSuccessResponse = z.infer<typeof browseByStyleSuccessResponseSchema>;
export type BrowseByStyleValidationErrorResponse = z.infer<
  typeof browseByStyleValidationErrorSchema
>;
export type BrowseByStyleRouteResponse = z.infer<typeof browseByStyleRouteResponseSchema>;
