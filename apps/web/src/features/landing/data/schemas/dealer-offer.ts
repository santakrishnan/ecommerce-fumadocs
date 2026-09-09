import { z } from "zod";

export const dealerOfferSchema = z.object({
  id: z.string().min(1).max(100),
  name: z.string().min(1).max(120),
  offerHeadline: z.string().min(1).max(200),
  imageSrc: z.url(),
  imageAlt: z.string().max(200),
});

export type DealerOfferData = z.infer<typeof dealerOfferSchema>;
