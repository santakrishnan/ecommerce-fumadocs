import { z } from "zod";

export const phoneVerificationRequestSchema = z.object({
  phone: z.string().regex(/^\+?1?\d{10}$/, "Enter a valid 10-digit phone number"),
  channel: z.enum(["sms", "voice"]).default("sms"),
});

export type PhoneVerificationRequest = z.infer<typeof phoneVerificationRequestSchema>;
