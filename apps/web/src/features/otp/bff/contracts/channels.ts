import { z } from "zod";

// Domain OTP channel — the value the stack speaks.
export const OTP_CHANNELS = ["EMAIL", "SMS"] as const;
export type OtpChannel = (typeof OTP_CHANNELS)[number];
export const otpChannelSchema = z.enum(OTP_CHANNELS);

// EDI wire channel. Mirrors the OpenAPI `PasswordlessIdentityChannel` enum —
// EDI's values, not ours. Kept distinct so provenance stays explicit; values
// coincide, so the BFF assigns across the boundary directly. Add a mapping here
// if EDI ever diverges.
export const EDI_PASSWORDLESS_CHANNELS = ["EMAIL", "SMS"] as const;
export type EdiPasswordlessChannel = (typeof EDI_PASSWORDLESS_CHANNELS)[number];
export const ediPasswordlessChannelSchema = z.enum(EDI_PASSWORDLESS_CHANNELS);
