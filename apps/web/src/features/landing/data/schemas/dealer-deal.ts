import { z } from "zod";

export const dealerDealSchema = z.object({
  vehicleId: z.string().trim().min(1).max(100),
  year: z.number().int().min(1886).max(2100),
  make: z.string().trim().min(1).max(100),
  model: z.string().trim().min(1).max(100),
  trim: z.string().trim().min(1).max(100).optional(),
  mileage: z.number().int().min(0).max(1_000_000),
  imageUrl: z.string().trim().min(1),
  imageAlt: z.string().trim().min(1).max(300),
  askingPrice: z.number().nonnegative(),
  financing: z.object({
    monthlyPayment: z.number().nonnegative(),
    totalPrice: z.number().nonnegative(),
    msrp: z.number().nonnegative().optional(),
    termMonths: z.number().int().min(1).max(120),
    aprPercent: z.number().min(0).max(100),
    minCreditScore: z.number().int().min(300).max(850),
  }),
  urgencyMessage: z.string().trim().min(1).max(300).optional(),
  buyNowHref: z.string().trim().min(1),
});

export type DealerDeal = z.infer<typeof dealerDealSchema>;
