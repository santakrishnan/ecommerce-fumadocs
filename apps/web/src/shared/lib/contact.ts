const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+]?1?[\s.-]?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}$/;
const PHONE_START_PATTERN = /^[+\d(]/;
const EMAIL_CHAR_PATTERN = /[@.]/;

function isValidContact(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  return EMAIL_PATTERN.test(trimmed) || PHONE_PATTERN.test(trimmed);
}

function formatContactDisplay(value: string): string {
  const trimmed = value.trim();
  if (PHONE_PATTERN.test(trimmed)) {
    const digits = trimmed.replace(/\D/g, "");
    const last4 = digits.slice(-4);
    return `(***) ***-${last4}`;
  }
  const atIndex = trimmed.indexOf("@");
  if (atIndex > 0) {
    const firstChar = trimmed[0];
    const domain = trimmed.slice(atIndex);
    return `${firstChar}***${domain}`;
  }
  return trimmed;
}

function formatPhoneInput(value: string): string {
  const digits = value.replace(/\D/g, "");
  const local = digits.startsWith("1") && digits.length > 10 ? digits.slice(1) : digits;
  if (local.length <= 3) {
    return local;
  }
  if (local.length <= 6) {
    return `${local.slice(0, 3)}-${local.slice(3)}`;
  }
  return `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6, 10)}`;
}

function looksLikePhone(value: string): boolean {
  return PHONE_START_PATTERN.test(value.trim()) && !EMAIL_CHAR_PATTERN.test(value);
}

export { formatContactDisplay, formatPhoneInput, isValidContact, looksLikePhone };
