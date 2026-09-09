import { z } from "zod/v4";

export const visitorIdentitySchema = z.object({
  fpId: z.string().min(1),
  sessionId: z.string().min(1),
  visitorId: z.string().min(1),
  geo: z.string().regex(/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/, 'geo must be "lat,lng"'),
  zip: z.string().regex(/^\d{5}$/, "zip must be a 5-digit US ZIP"),
});

export type VisitorIdentityInput = z.infer<typeof visitorIdentitySchema>;
