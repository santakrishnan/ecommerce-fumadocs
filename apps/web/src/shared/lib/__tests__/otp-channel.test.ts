import { describe, expect, it } from "vitest";
import {
  detectOtpChannelType,
  formatPhoneInput,
  getOtpChannelValidationError,
  isValidOtpChannelInput,
  looksLikePhone,
  normalizeOtpChannelInput,
} from "../otp-channel";

describe("looksLikePhone", () => {
  it("treats phone-leading input (digit/+/() without letters or @ as phone", () => {
    expect(looksLikePhone("555")).toBe(true);
    expect(looksLikePhone("+1555")).toBe(true);
    expect(looksLikePhone("(555")).toBe(true);
  });

  it("treats input with letters, @, or no phone-lead as non-phone", () => {
    expect(looksLikePhone("555abc")).toBe(false);
    expect(looksLikePhone("user@domain.com")).toBe(false);
    expect(looksLikePhone("hello")).toBe(false);
    expect(looksLikePhone("   ")).toBe(false);
  });
});

describe("formatPhoneInput", () => {
  it("groups digits progressively into XXX-XXX-XXXX", () => {
    expect(formatPhoneInput("555")).toBe("555");
    expect(formatPhoneInput("555123")).toBe("555-123");
    expect(formatPhoneInput("5551234567")).toBe("555-123-4567");
  });

  it("strips a +1 country code but keeps a bare typed leading 1", () => {
    // Regression: an 11th digit must not drop the first when there's no +1.
    expect(formatPhoneInput("+15551234567")).toBe("555-123-4567");
    expect(formatPhoneInput("15551234567")).toBe("155-512-3456");
  });

  it("caps at 10 digits and ignores separators", () => {
    expect(formatPhoneInput("555123456789")).toBe("555-123-4567");
    expect(formatPhoneInput("555.123.4567")).toBe("555-123-4567");
    expect(formatPhoneInput("(555) 123-4567")).toBe("555-123-4567");
  });
});

describe("isValidOtpChannelInput", () => {
  it("accepts valid emails and 10-digit phones (trimmed)", () => {
    expect(isValidOtpChannelInput("user+tag@test.com")).toBe(true);
    expect(isValidOtpChannelInput("123user@example.com")).toBe(true);
    expect(isValidOtpChannelInput("  555-123-4567  ")).toBe(true);
    expect(isValidOtpChannelInput("5551234567")).toBe(true);
  });

  it("rejects empty, malformed emails, and out-of-range phones", () => {
    expect(isValidOtpChannelInput("")).toBe(false);
    expect(isValidOtpChannelInput("user@domain")).toBe(false);
    expect(isValidOtpChannelInput("user@@test.com")).toBe(false);
    expect(isValidOtpChannelInput("555-123-456")).toBe(false);
    expect(isValidOtpChannelInput("+1")).toBe(false);
  });
});

describe("detectOtpChannelType", () => {
  it("classifies by leading character", () => {
    expect(detectOtpChannelType("+15551234567")).toBe("phone");
    expect(detectOtpChannelType("user@test.com")).toBe("email");
  });
});

describe("getOtpChannelValidationError", () => {
  it("returns null for empty or valid input", () => {
    expect(getOtpChannelValidationError("")).toBeNull();
    expect(getOtpChannelValidationError("test@example.com")).toBeNull();
    expect(getOtpChannelValidationError("555-123-4567")).toBeNull();
  });

  it("returns the hint for invalid input", () => {
    const hint = "Enter a valid phone number or email";
    expect(getOtpChannelValidationError("555-12")).toBe(hint);
    expect(getOtpChannelValidationError("notanemail")).toBe(hint);
    expect(getOtpChannelValidationError("----")).toBe(hint);
  });
});

describe("normalizeOtpChannelInput", () => {
  it("lowercases and trims emails", () => {
    expect(normalizeOtpChannelInput("  User@Example.COM  ")).toBe("user@example.com");
  });

  it("trims phones but leaves digits/formatting untouched (E.164 is BFF scope)", () => {
    expect(normalizeOtpChannelInput("  555-123-4567  ")).toBe("555-123-4567");
    expect(normalizeOtpChannelInput("+15551234567")).toBe("+15551234567");
  });
});
