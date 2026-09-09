import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { phoneVerificationRequestSchema } from "@features/origination/bff/contracts";
import { describe, expect, it } from "vitest";
import { phoneFormSchema } from "../lib/phone-form-schema";

const DUPLICATE_REGEX_PATTERN = /\.regex\s*\(/;

describe("phoneFormSchema", () => {
  it("normalizes a formatted phone value before applying the shared contract rule", () => {
    const result = phoneFormSchema.safeParse({ phone: "+1 (555) 123-4567" });

    expect(result).toEqual({
      success: true,
      data: { phone: "5551234567" },
    });
  });

  it("normalizes a leading-one paste value before applying the shared contract rule", () => {
    const result = phoneFormSchema.safeParse({ phone: "1-555-123-4567" });

    expect(result).toEqual({
      success: true,
      data: { phone: "5551234567" },
    });
  });

  it("rejects display values that do not resolve to ten digits", () => {
    const result = phoneFormSchema.safeParse({ phone: "(555) 123" });

    expect(result.success).toBe(false);
    expect(phoneVerificationRequestSchema.shape.phone.safeParse("555123").success).toBe(false);
  });

  it("references the shared phone rule without declaring a duplicate regex", () => {
    const source = readFileSync(
      resolve(import.meta.dirname, "..", "lib", "phone-form-schema.ts"),
      "utf8"
    );

    expect(source).toContain(".pipe(phoneVerificationRequestSchema.shape.phone)");
    expect(source).not.toMatch(DUPLICATE_REGEX_PATTERN);
  });
});
