import { z } from "zod";

const budgetCalculatorPayloadSchema = z.object({
  downPayment: z.number().int().nonnegative(),
  monthlyPayment: z.number().int().nonnegative(),
});

export const profileActivityRequestSchema = z.object({
  activityType: z.literal("budget-calculator"),
  payload: budgetCalculatorPayloadSchema,
});

export const profileActivityRecordedSchema = z.object({
  activityId: z.string().regex(/^act_[a-z0-9]{6}$/),
  activityType: z.literal("budget-calculator"),
  recordedAt: z.iso.datetime(),
  status: z.literal("recorded"),
});

export const profileActivityQueuedSchema = z.object({
  activityId: z.null(),
  activityType: z.literal("budget-calculator"),
  status: z.literal("queued"),
  warnings: z.array(z.literal("profile-unavailable")).min(1),
});

export const profileActivityResponseSchema = z.union([
  profileActivityRecordedSchema,
  profileActivityQueuedSchema,
]);

export const profileActivityValidationErrorSchema = z.object({
  error: z.object({
    code: z.literal("PROFILE_ACTIVITY_VALIDATION_FAILED"),
    message: z.literal("Activity payload did not match contract."),
    details: z.object({
      endpoint: z.literal("/api/v1/profile/activities"),
    }),
  }),
});

export const profileActivityCaptureErrorSchema = z.object({
  error: z.object({
    code: z.literal("PROFILE_ACTIVITY_CAPTURE_FAILED"),
    message: z.string(),
    details: z.object({
      endpoint: z.literal("/api/v1/profile/activities"),
    }),
  }),
});

export const profileActivityRouteResponseSchema = z.union([
  profileActivityResponseSchema,
  profileActivityValidationErrorSchema,
  profileActivityCaptureErrorSchema,
]);

export type ProfileActivityRequest = z.infer<typeof profileActivityRequestSchema>;
export type ProfileActivityRecorded = z.infer<typeof profileActivityRecordedSchema>;
export type ProfileActivityQueued = z.infer<typeof profileActivityQueuedSchema>;
export type ProfileActivityResponse = z.infer<typeof profileActivityResponseSchema>;
export type ProfileActivityRouteResponse = z.infer<typeof profileActivityRouteResponseSchema>;
