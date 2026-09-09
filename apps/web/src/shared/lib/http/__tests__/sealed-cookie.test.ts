// @vitest-environment node
import { describe, expect, it } from "vitest";
import { buildCookieConfig, decodeCookieValue, encodeCookieValue } from "../sealed-cookie";

const NON_BASE64URL = /[+/=]/;

describe("sealed-cookie codec", () => {
  it("round-trips ASCII", () => {
    const encoded = encodeCookieValue("hello world");
    expect(decodeCookieValue(encoded)).toBe("hello world");
  });

  it("round-trips Unicode (multi-byte UTF-8)", () => {
    const value = "🚗 résumé · 日本語";
    const encoded = encodeCookieValue(value);
    expect(decodeCookieValue(encoded)).toBe(value);
  });

  it("produces transport-safe Base64url (no + / or = padding)", () => {
    const encoded = encodeCookieValue("hello world??");
    expect(encoded).not.toMatch(NON_BASE64URL);
  });

  it("returns null for empty / invalid input", () => {
    expect(decodeCookieValue("")).toBeNull();
    // atob throws on non-base64 characters; we catch and return null.
    expect(decodeCookieValue("***not-base64***")).toBeNull();
  });
});

describe("buildCookieConfig", () => {
  it("uses bare name and Secure=false in development", () => {
    const prev = process.env.NODE_ENV;
    (process.env as Record<string, string | undefined>).NODE_ENV = "development";
    try {
      const config = buildCookieConfig("_sid", 3600);
      expect(config.name).toBe("_sid");
      expect(config.secure).toBe(false);
      expect(config.httpOnly).toBe(true);
      expect(config.sameSite).toBe("lax");
      expect(config.path).toBe("/");
      expect(config.maxAge).toBe(3600);
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = prev;
    }
  });

  it("adds __Host- prefix and Secure in production", () => {
    const prev = process.env.NODE_ENV;
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    try {
      const config = buildCookieConfig("_sid", 60);
      expect(config.name).toBe("__Host-_sid");
      expect(config.secure).toBe(true);
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = prev;
    }
  });

  it("honours sameSite and httpOnly overrides", () => {
    const config = buildCookieConfig("_sid", 60, { sameSite: "strict", httpOnly: false });
    expect(config.sameSite).toBe("strict");
    expect(config.httpOnly).toBe(false);
  });
});
