const NON_DIGIT_PATTERN = /\D/g;
const MAX_PHONE_DIGITS = 10;

export function normalizePhone(value: string): string {
  const digits = value.replace(NON_DIGIT_PATTERN, "");

  if (digits.length === 11 && digits.startsWith("1")) {
    return digits.slice(1);
  }

  return digits;
}

export function formatPhone(value: string, dropCountryCode = true): string {
  const normalized = dropCountryCode ? normalizePhone(value) : value.replace(NON_DIGIT_PATTERN, "");
  const digits = normalized.slice(0, MAX_PHONE_DIGITS);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  }

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
