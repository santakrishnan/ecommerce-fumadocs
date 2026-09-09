import { z } from "zod";

export const categorySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(80),
  href: z.string().min(1).max(2048),
  imageUrl: z.url(),
  description: z.string().max(500).optional(),
});

export type Category = z.infer<typeof categorySchema>;
