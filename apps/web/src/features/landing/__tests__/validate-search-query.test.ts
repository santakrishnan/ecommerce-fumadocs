// @vitest-environment node
import { describe, expect, it } from "vitest";
import { MAX_QUERY_LENGTH, searchQuerySchema } from "../lib/validate-search-query";

// Helper: assert a value passes the schema and returns the trimmed string
function expectValid(input: string, expected = input.trim()) {
  const result = searchQuerySchema.safeParse(input);
  expect(result.success).toBe(true);
  if (result.success) {
    expect(result.data).toBe(expected);
  }
}

// Helper: assert a value fails the schema
function expectInvalid(input: string) {
  expect(searchQuerySchema.safeParse(input).success).toBe(false);
}

// ─── searchQuerySchema ───────────────────────────────────────────────────────

describe("searchQuerySchema", () => {
  describe("valid inputs pass through trimmed", () => {
    it("accepts a normal search query", () => {
      expectValid("RAV4 under 30k");
    });

    it("trims leading and trailing whitespace", () => {
      expectValid("  SUV with low mileage  ", "SUV with low mileage");
    });

    it("accepts a single character after trim", () => {
      expectValid(" x ", "x");
    });

    it("accepts exactly MAX_QUERY_LENGTH characters", () => {
      expectValid("a".repeat(MAX_QUERY_LENGTH));
    });

    it("accepts natural-language query with special characters", () => {
      expectValid("What's the difference between RAV4 & Highlander?");
    });

    it("accepts query with numbers and slashes", () => {
      expectValid("2021/2022 Toyota Supra");
    });

    it("does not modify valid content beyond trimming", () => {
      const query = "Family SUV under $35,000 with leather seats";
      expectValid(query);
    });
  });

  describe("empty and whitespace-only inputs are rejected", () => {
    it("rejects an empty string", () => {
      expectInvalid("");
    });

    it("rejects a whitespace-only string", () => {
      expectInvalid("   ");
    });

    it("rejects a tab-only string", () => {
      expectInvalid("\t\t");
    });

    it("rejects a newline-only string", () => {
      expectInvalid("\n\n");
    });
  });

  describe("length limits are enforced", () => {
    it("rejects input exceeding MAX_QUERY_LENGTH", () => {
      expectInvalid("a".repeat(MAX_QUERY_LENGTH + 1));
    });

    it("length check applies to trimmed value", () => {
      // Padding spaces don't push it over the limit once trimmed
      expectValid(` ${"a".repeat(MAX_QUERY_LENGTH)} `, "a".repeat(MAX_QUERY_LENGTH));
    });
  });

  describe("obviously dangerous HTML/script patterns are blocked", () => {
    it("blocks <script> tag", () => {
      expectInvalid("<script>alert(1)</script>");
    });

    it("blocks <script> with attributes", () => {
      expectInvalid('<script src="evil.js">');
    });

    it("blocks </script> closing tag", () => {
      expectInvalid("</script>");
    });

    it("blocks javascript: URI", () => {
      expectInvalid("javascript:alert(1)");
    });

    it("blocks javascript: URI with spaces", () => {
      expectInvalid("javascript :alert(1)");
    });

    it("blocks inline event handler onclick", () => {
      expectInvalid('onclick="evil()"');
    });

    it("blocks inline event handler onerror", () => {
      expectInvalid("onerror='bad()'");
    });

    it("blocks unquoted inline event handler onclick", () => {
      expectInvalid("onclick=evil()");
    });

    it("blocks unquoted inline event handler onerror", () => {
      expectInvalid("onerror=bad");
    });

    it("blocks <iframe>", () => {
      expectInvalid("<iframe src='x'>");
    });

    it("blocks <object>", () => {
      expectInvalid("<object data='x'>");
    });

    it("blocks <embed>", () => {
      expectInvalid("<embed src='x'>");
    });

    it("blocks data:text/html URI", () => {
      expectInvalid("data:text/html,<h1>hi</h1>");
    });

    it("blocks mixed-case script tag", () => {
      expectInvalid("<SCRIPT>alert(1)</SCRIPT>");
    });

    it("blocks script tag embedded in natural language", () => {
      expectInvalid("Show me SUVs <script>steal()</script>");
    });
  });

  describe("validation rule ordering", () => {
    it("empty fails before unsafe pattern check", () => {
      // Should fail as empty, not unsafe
      expectInvalid("");
    });

    it("too-long string fails before unsafe pattern check", () => {
      expectInvalid("a".repeat(MAX_QUERY_LENGTH + 1));
    });
  });
});
