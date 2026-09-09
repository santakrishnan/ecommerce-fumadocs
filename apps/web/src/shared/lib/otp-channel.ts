import { isValidEmail, isValidPhone } from "utils";

export type OtpChannelType = "email" | "phone";

export interface OtpChannelPayload {
  type: OtpChannelType;
  value: string;
}

const PHONE_START_PATTERN = /^[+\d(]/;
const COUNTRY_CODE_PREFIX_PATTERN = /^\+\s*1/;
const EMAIL_CHAR_PATTERN = /[@]/;
const HAS_LETTERS_PATTERN = /[a-z]/i;
const HAS_ALPHANUMERIC_PATTERN = /[a-z0-9]/i;

const INVALID_CONTACT_HINT = "Enter a valid phone number or email";

/** True when input starts with a phone char (digit/+/() and has no `@` or letters. */
export function looksLikePhone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  return (
    PHONE_START_PATTERN.test(trimmed) &&
    !EMAIL_CHAR_PATTERN.test(trimmed) &&
    !HAS_LETTERS_PATTERN.test(trimmed)
  );
}

/**
 * Formats digits as a US phone number: 555-123-4567. Keeps the first 10 local
 * digits; strips a leading `1` only when the raw input has a `+1` prefix.
 */
export function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 0) {
    return value;
  }

  const hasCountryCode = COUNTRY_CODE_PREFIX_PATTERN.test(value.trim()) && digits.startsWith("1");
  const local = hasCountryCode ? digits.slice(1) : digits;
  const capped = local.slice(0, 10);

  if (capped.length <= 3) {
    return capped;
  }
  if (capped.length <= 6) {
    return `${capped.slice(0, 3)}-${capped.slice(3)}`;
  }
  return `${capped.slice(0, 3)}-${capped.slice(3, 6)}-${capped.slice(6)}`;
}

/**
 * Stricter email check on top of the canonical `isValidEmail` from utils.
 * Rejects local parts that contain no alphanumeric characters
 * (e.g. "----@gmail.com", "!!!@domain.com", ".@test.com").
 */
function isStrictValidEmail(value: string): boolean {
  if (!isValidEmail(value)) {
    return false;
  }
  const localPart = value.slice(0, value.indexOf("@"));
  if (!HAS_ALPHANUMERIC_PATTERN.test(localPart)) {
    return false;
  }
  if (localPart.startsWith(".") || localPart.endsWith(".")) {
    return false;
  }
  return true;
}

export function isValidOtpChannelInput(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  if (looksLikePhone(trimmed)) {
    const digitsOnly = trimmed.replace(/\D/g, "");
    return isValidPhone(digitsOnly);
  }
  return isStrictValidEmail(trimmed);
}

export function detectOtpChannelType(value: string): OtpChannelType {
  return looksLikePhone(value.trim()) ? "phone" : "email";
}

export function normalizeOtpChannelInput(value: string): string {
  const trimmed = value.trim();
  return detectOtpChannelType(trimmed) === "email" ? trimmed.toLowerCase() : trimmed;
}

export function getOtpChannelValidationError(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  return isValidOtpChannelInput(trimmed) ? null : INVALID_CONTACT_HINT;
}

export function maskOtpChannel({ type, value }: OtpChannelPayload): string {
  if (type === "phone") {
    return `(***) ***-${value.replace(/\D/g, "").slice(-4)}`;
  }
  const [local = "", domain = ""] = value.split("@");
  return `${local.slice(0, 1)}***@${domain}`;
}
