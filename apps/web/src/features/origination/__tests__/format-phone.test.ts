// @vitest-environment node

import { describe, expect, it } from "vitest";
import { formatPhone, normalizePhone } from "../lib/format-phone";

describe("normalizePhone", () => {
  it("strips non-digits from a phone number", () => {
    expect(normalizePhone("(555) 123-4567")).toBe("5551234567");
  });

  it("drops a single leading one from an eleven-digit phone number", () => {
    expect(normalizePhone("+1 (555) 123-4567")).toBe("5551234567");
    expect(normalizePhone("1-555-123-4567")).toBe("5551234567");
  });

  it("returns an empty string when the input contains no digits", () => {
    expect(normalizePhone("phone")).toBe("");
  });
});

describe("formatPhone", () => {
  it("formats ten digits as a U.S. phone number", () => {
    expect(formatPhone("5551234567")).toBe("(555) 123-4567");
  });

  it("formats a pasted phone number with a plus-one prefix", () => {
    expect(formatPhone("+1 (555) 123-4567")).toBe("(555) 123-4567");
  });

  it("formats a pasted phone number with a leading-one prefix", () => {
    expect(formatPhone("1-555-123-4567")).toBe("(555) 123-4567");
  });

  it("retains a typed leading one when input exceeds ten digits", () => {
    expect(formatPhone("12345678901", false)).toBe("(123) 456-7890");
  });

  it("progressively formats partial input", () => {
    expect(formatPhone("555")).toBe("555");
    expect(formatPhone("555123")).toBe("(555) 123");
    expect(formatPhone("5551234")).toBe("(555) 123-4");
  });

  it("returns an empty string for non-digit input", () => {
    expect(formatPhone("not a phone number")).toBe("");
  });
});
