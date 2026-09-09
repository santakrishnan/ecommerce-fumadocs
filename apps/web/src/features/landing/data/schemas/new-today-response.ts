import { z } from "zod";

const surfaceSchema = z.enum(["light", "dark"]).optional();

export const newTodayVehicleInfoSchema = z.object({
  VehicleID: z.number().int().nonnegative(),
  Year: z.number().int().min(1900).max(2100),
  Make: z.string().min(1).max(60),
  Model: z.string().min(1).max(60),
  Trim: z.string().max(80).nullable(),
  Mileage: z.number().int().nonnegative(),
  VDPLink: z.url().nullable(),
  Vin: z.string().length(17).optional().nullable(),
  Surface: surfaceSchema,
});

export const newTodayPhotoSchema = z.object({
  VehiclePhotoID: z.string().min(1),
  PhotoUrl: z.string().min(1),
  Order: z.number().int().positive(),
  PhotoTimestamp: z.string().min(1),
});

export const newTodayPricingSchema = z.object({
  Cost: z.number().nonnegative(),
  List: z.number().nonnegative(),
  Special: z.number().nonnegative(),
  ExtraPrice1: z.number(),
  ExtraPrice2: z.number(),
  ExtraPrice3: z.number(),
});

export const newTodayVehicleSchema = z.object({
  VehicleInfo: newTodayVehicleInfoSchema,
  ListOfPhotos: z.array(newTodayPhotoSchema),
  Pricing: newTodayPricingSchema,
});

export const newTodaySuccessResponseSchema = z.object({
  vehicles: z.array(newTodayVehicleSchema),
});

export const newTodayValidationErrorResponseSchema = z.object({
  error: z.object({
    code: z.literal("UPSTREAM_SCHEMA_VALIDATION_FAILED"),
    message: z.literal("New Today payload did not match contract."),
    details: z.object({
      endpoint: z.literal("/api/v1/recommendations/today"),
    }),
  }),
});

export const newTodayResponseSchema = z.union([
  newTodaySuccessResponseSchema,
  newTodayValidationErrorResponseSchema,
]);

export type NewTodayVehicle = z.infer<typeof newTodayVehicleSchema>;
export type NewTodaySuccessResponse = z.infer<typeof newTodaySuccessResponseSchema>;
export type NewTodayValidationErrorResponse = z.infer<typeof newTodayValidationErrorResponseSchema>;
export type NewTodayResponse = z.infer<typeof newTodayResponseSchema>;
