import { z } from "zod";

export const editorialContentSchema = z.object({
  heroHeadline: z.string().min(1).max(120),
  heroSubheading: z.string().max(240),
  heroCtaLabel: z.string().min(1).max(60),
  heroCtaUrl: z.url(),
  heroImageUrl: z.url(),
});

export type EditorialContent = z.infer<typeof editorialContentSchema>;
