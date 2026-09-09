import { z } from "zod";
import { vdpVinSchema } from "./vdp-request.schema";

export const vdpSearchFaqRequestSchema = z.object({
  vin: vdpVinSchema,
  question: z.string().min(1).max(500),
});

export type VdpSearchFaqRequest = z.infer<typeof vdpSearchFaqRequestSchema>;

export const vdpFaqCardSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  image: z.string().optional(),
  highlights: z.array(z.string()).optional(),
  attributes: z
    .array(
      z.object({
        key: z.string().min(1),
        label: z.string().min(1),
        value: z.string().min(1),
      })
    )
    .optional(),
  availableCount: z.number().int().min(0),
  nextSearchPlan: z.object({
    searchId: z.string(),
    filters: z
      .array(
        z.object({
          key: z.string(),
          value: z.union([z.string(), z.number(), z.boolean()]).optional(),
          values: z.array(z.union([z.string(), z.number()])).optional(),
          min: z.number().optional(),
          max: z.number().optional(),
        })
      )
      .default([]),
  }),
  isReadOnly: z.literal(true),
});

export type VdpFaqCard = z.infer<typeof vdpFaqCardSchema>;

export const vdpFaqMessageSchema = z.object({
  id: z.string().min(1),
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

export type VdpFaqMessage = z.infer<typeof vdpFaqMessageSchema>;

export const vdpSearchFaqResponseDataSchema = z.object({
  vin: z.string().min(1),
  query: z.string().min(1),
  searchContext: z.object({
    scope: z.literal("vdp"),
    searchId: z.string().nullable(),
    isPersistent: z.literal(false),
    source: z.literal("vdp-faq-pill"),
  }),
  messages: z.array(vdpFaqMessageSchema).min(2),
  answer: z.object({
    summary: z.string().min(1),
    supportingPoints: z.array(z.string().min(1)).optional(),
  }),
  results: z
    .object({
      responseMode: z.string().optional(),
      optionLevel: z.string().optional(),
      cards: z.array(vdpFaqCardSchema).default([]),
    })
    .optional(),
  suggestedFollowUps: z.array(z.string().min(1)).optional(),
});

export type VdpSearchFaqResponseData = z.infer<typeof vdpSearchFaqResponseDataSchema>;

export const vdpSearchFaqApiResponseSchema = z.object({
  data: vdpSearchFaqResponseDataSchema,
  meta: z.object({
    traceId: z.string(),
    timestamp: z.string(),
  }),
});

export type VdpSearchFaqApiResponse = z.infer<typeof vdpSearchFaqApiResponseSchema>;
