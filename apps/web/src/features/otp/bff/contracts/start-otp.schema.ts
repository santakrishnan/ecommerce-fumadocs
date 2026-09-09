import { z } from "zod";
import { ediPasswordlessChannelSchema, otpChannelSchema } from "./channels";

// E.164: leading +, 1-15 digits.
const E164_PATTERN = /^\+[0-9]{1,15}$/;

// Request contract; validated by the mock against the channel/recipient rules.
export const startOtpRequestSchema = z
  .object({
    channel: ediPasswordlessChannelSchema,
    recipient: z.string().min(1),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.channel === "EMAIL" && !z.email().safeParse(value.recipient).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recipient"],
        message: "Provide a valid email address.",
      });
    }
    if (value.channel === "SMS" && !E164_PATTERN.test(value.recipient)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recipient"],
        message: "Provide a valid E.164 phone number.",
      });
    }
  });

// Domain response exposed by the route envelope.
export const startOtpResponseSchema = z.object({
  started: z.boolean(),
  channel: otpChannelSchema,
  recipient: z.string().min(1),
  message: z.string().optional(),
});

export type StartOtpResponse = z.infer<typeof startOtpResponseSchema>;
