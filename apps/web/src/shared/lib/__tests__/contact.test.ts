import { describe, expect, it } from "vitest";
import { formatContactDisplay, formatPhoneInput, isValidContact, looksLikePhone } from "../contact";

describe("isValidContact", () => {
  it("accepts valid emails and phone numbers", () => {
    expect(isValidContact("jason@gmail.com")).toBe(true);
    expect(isValidContact("212-555-1234")).toBe(true);
    expect(isValidContact("2125551234")).toBe(true);
    expect(isValidContact("+1 (212) 555-1234")).toBe(true);
  });

  it("rejects incomplete or empty input", () => {
    expect(isValidContact("")).toBe(false);
    expect(isValidContact("   ")).toBe(false);
    expect(isValidContact("test@")).toBe(false);
    expect(isValidContact("55512")).toBe(false);
  });
});

describe("looksLikePhone", () => {
  it("treats digit/paren/plus starts without email chars as phone", () => {
    expect(looksLikePhone("212")).toBe(true);
    expect(looksLikePhone("(212")).toBe(true);
    expect(looksLikePhone("+1212")).toBe(true);
  });

  it("treats anything with @ or . as not-a-phone", () => {
    expect(looksLikePhone("jason@")).toBe(false);
    expect(looksLikePhone("a.b")).toBe(false);
  });
});

describe("formatPhoneInput", () => {
  it("formats progressively as digits are typed", () => {
    expect(formatPhoneInput("212")).toBe("212");
    expect(formatPhoneInput("212555")).toBe("212-555");
    expect(formatPhoneInput("2125551234")).toBe("212-555-1234");
  });

  it("drops a leading country-code 1", () => {
    expect(formatPhoneInput("12125551234")).toBe("212-555-1234");
  });
});

describe("formatContactDisplay", () => {
  it("masks a phone number to the last four digits", () => {
    expect(formatContactDisplay("212-555-1234")).toBe("(***) ***-1234");
  });

  it("masks an email to the first char + domain", () => {
    expect(formatContactDisplay("jason@gmail.com")).toBe("j***@gmail.com");
  });
});
