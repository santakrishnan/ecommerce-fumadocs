import type { EdiPasswordlessChannel } from "../bff/contracts/channels";

// Client-safe OTP start payload helpers, shared by profile, watch list, and search.

/** US phone shapes the sign-in inputs accept. */
export const PHONE_PATTERN = /^[+]?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;

/** EDI wire body: `{ channel, recipient }`. */
export interface StartOtpEdiPayload {
  channel: EdiPasswordlessChannel;
  recipient: string;
}

// Pick channel from the raw contact value; normalize SMS recipients to E.164.
export function toStartOtpEdiPayload(value: string): StartOtpEdiPayload {
  const trimmed = value.trim();
  if (PHONE_PATTERN.test(trimmed)) {
    const digits = trimmed.replace(/\D/g, "");
    const local = digits.length > 10 && digits.startsWith("1") ? digits.slice(1) : digits;
    return { channel: "SMS", recipient: `+1${local}` };
  }
  return { channel: "EMAIL", recipient: trimmed };
}
