// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  anySignal,
  backoffMs,
  buildUrl,
  isIdempotentMethod,
  isRetryableStatus,
  mergeHeaders,
  parseRetryAfter,
  readErrorBody,
  resolveToken,
  serialiseBody,
} from "../internal";

describe("buildUrl", () => {
  it("joins base + path with normalised slashes", () => {
    expect(buildUrl("https://api.test", "/v1/x")).toBe("https://api.test/v1/x");
    expect(buildUrl("https://api.test/", "v1/x")).toBe("https://api.test/v1/x");
    expect(buildUrl("https://api.test/", "/v1/x")).toBe("https://api.test/v1/x");
  });

  it("returns absolute paths untouched", () => {
    expect(buildUrl("https://api.test", "https://other.test/foo")).toBe("https://other.test/foo");
  });

  it("appends query params and skips null/undefined", () => {
    const url = buildUrl("https://api.test", "/q", {
      a: 1,
      b: "two",
      c: null,
      d: undefined,
      e: true,
    });
    const parsed = new URL(url);
    expect(parsed.searchParams.get("a")).toBe("1");
    expect(parsed.searchParams.get("b")).toBe("two");
    expect(parsed.searchParams.has("c")).toBe(false);
    expect(parsed.searchParams.has("d")).toBe(false);
    expect(parsed.searchParams.get("e")).toBe("true");
  });

  it("repeats array params", () => {
    const url = buildUrl("https://api.test", "/q", { tag: ["a", "b", "c"] });
    const parsed = new URL(url);
    expect(parsed.searchParams.getAll("tag")).toEqual(["a", "b", "c"]);
  });

  it("appends to URLs that already contain a query string", () => {
    const url = buildUrl("https://api.test", "/q?keep=1", { add: "2" });
    const parsed = new URL(url);
    expect(parsed.searchParams.get("keep")).toBe("1");
    expect(parsed.searchParams.get("add")).toBe("2");
  });
});

describe("mergeHeaders", () => {
  it("treats names case-insensitively (later wins)", () => {
    const merged = mergeHeaders(
      { "Content-Type": "application/json" },
      { "content-type": "text/plain" }
    );
    expect(merged.get("content-type")).toBe("text/plain");
  });

  it("accepts Headers, plain objects, and arrays", () => {
    const merged = mergeHeaders(new Headers({ a: "1" }), { b: "2" }, [["c", "3"]]);
    expect(merged.get("a")).toBe("1");
    expect(merged.get("b")).toBe("2");
    expect(merged.get("c")).toBe("3");
  });

  it("ignores undefined sources", () => {
    const merged = mergeHeaders(undefined, { a: "1" }, undefined);
    expect(merged.get("a")).toBe("1");
  });
});

describe("serialiseBody", () => {
  it("returns no body for undefined / null", () => {
    expect(serialiseBody(undefined)).toEqual({ body: undefined, contentType: null });
    expect(serialiseBody(null)).toEqual({ body: undefined, contentType: null });
  });

  it("JSON-stringifies plain objects with application/json", () => {
    const out = serialiseBody({ a: 1 });
    expect(out.body).toBe('{"a":1}');
    expect(out.contentType).toBe("application/json");
  });

  it("passes through FormData without setting Content-Type", () => {
    const form = new FormData();
    form.append("file", new Blob(["x"]), "x.txt");
    const out = serialiseBody(form);
    expect(out.body).toBe(form);
    expect(out.contentType).toBeNull();
  });

  it("passes through strings", () => {
    const out = serialiseBody("raw");
    expect(out.body).toBe("raw");
    expect(out.contentType).toBeNull();
  });

  it("passes through URLSearchParams", () => {
    const params = new URLSearchParams({ a: "1" });
    const out = serialiseBody(params);
    expect(out.body).toBe(params);
  });
});

describe("parseRetryAfter", () => {
  it("parses seconds", () => {
    expect(parseRetryAfter("0")).toBe(0);
    expect(parseRetryAfter("3")).toBe(3000);
    expect(parseRetryAfter("  5 ")).toBe(5000);
  });

  it("parses HTTP-date and clamps negatives to 0", () => {
    const future = new Date(Date.now() + 2000).toUTCString();
    const ms = parseRetryAfter(future);
    expect(ms).not.toBeNull();
    expect(ms ?? 0).toBeGreaterThan(0);

    const past = new Date(Date.now() - 5000).toUTCString();
    expect(parseRetryAfter(past)).toBe(0);
  });

  it("returns null for garbage / empty", () => {
    expect(parseRetryAfter(null)).toBeNull();
    expect(parseRetryAfter("")).toBeNull();
    expect(parseRetryAfter("nonsense")).toBeNull();
  });
});

describe("backoffMs", () => {
  it("prefers Retry-After when present", () => {
    expect(backoffMs(100, 5, 2000)).toBe(2000);
  });

  it("applies exponential growth with jitter ≥ 50% of base*2^attempt", () => {
    // rng returns 0 → jitter factor = 0.5
    expect(backoffMs(100, 0, null, () => 0)).toBe(50);
    expect(backoffMs(100, 1, null, () => 0)).toBe(100);
    expect(backoffMs(100, 2, null, () => 0)).toBe(200);
    // rng returns 1 → jitter factor = 1.0
    expect(backoffMs(100, 2, null, () => 1)).toBe(400);
  });
});

describe("readErrorBody", () => {
  it("parses JSON once and extracts `code` field", async () => {
    const response = new Response(JSON.stringify({ code: "RATE_LIMITED", detail: "x" }), {
      status: 429,
    });
    const { body, code } = await readErrorBody(response);
    expect(code).toBe("RATE_LIMITED");
    expect(body).toEqual({ code: "RATE_LIMITED", detail: "x" });
  });

  it("falls back to text body and HTTP_xxx code on non-JSON", async () => {
    const response = new Response("oops", { status: 500 });
    const { body, code } = await readErrorBody(response);
    expect(body).toBe("oops");
    expect(code).toBe("HTTP_500");
  });

  it("does not double-read the body", async () => {
    const response = new Response("plain", { status: 502 });
    await readErrorBody(response);
    // bodyUsed should be true; reading again would throw if we tried.
    expect(response.bodyUsed).toBe(true);
  });

  it("returns null body on empty response", async () => {
    const response = new Response("", { status: 404 });
    const { body, code } = await readErrorBody(response);
    expect(body).toBeNull();
    expect(code).toBe("HTTP_404");
  });
});

describe("resolveToken", () => {
  it("returns null for undefined / null", async () => {
    await expect(resolveToken(undefined)).resolves.toBeNull();
  });

  it("returns string tokens as-is", async () => {
    await expect(resolveToken("abc")).resolves.toBe("abc");
  });

  it("invokes function tokens", async () => {
    await expect(resolveToken(() => "dyn")).resolves.toBe("dyn");
    await expect(resolveToken(async () => "async-dyn")).resolves.toBe("async-dyn");
  });

  it("returns null when the function returns nullish", async () => {
    await expect(resolveToken(() => null)).resolves.toBeNull();
    await expect(resolveToken(() => undefined)).resolves.toBeNull();
  });
});

describe("isIdempotentMethod", () => {
  it.each([
    "GET",
    "HEAD",
    "OPTIONS",
    "PUT",
    "DELETE",
    "get",
    "Put",
  ])("treats %s as idempotent", (m) => {
    expect(isIdempotentMethod(m)).toBe(true);
  });

  it.each(["POST", "PATCH"])("treats %s as non-idempotent", (m) => {
    expect(isIdempotentMethod(m)).toBe(false);
  });
});

describe("isRetryableStatus", () => {
  it("treats 0, 408, 425, 429 and 5xx as retryable by default", () => {
    expect(isRetryableStatus(0)).toBe(true);
    expect(isRetryableStatus(408)).toBe(true);
    expect(isRetryableStatus(425)).toBe(true);
    expect(isRetryableStatus(429)).toBe(true);
    expect(isRetryableStatus(500)).toBe(true);
    expect(isRetryableStatus(599)).toBe(true);
  });

  it("treats 4xx (other than 408/425/429) as non-retryable", () => {
    expect(isRetryableStatus(400)).toBe(false);
    expect(isRetryableStatus(401)).toBe(false);
    expect(isRetryableStatus(404)).toBe(false);
  });

  it("respects an explicit allow-list", () => {
    const allow = new Set([409]);
    expect(isRetryableStatus(429, allow)).toBe(false);
    expect(isRetryableStatus(409, allow)).toBe(true);
  });
});

describe("anySignal", () => {
  it("aborts when any input signal aborts", () => {
    const a = new AbortController();
    const b = new AbortController();
    const composed = anySignal([a.signal, b.signal]);
    expect(composed.aborted).toBe(false);
    a.abort();
    expect(composed.aborted).toBe(true);
  });

  it("is already aborted if any input is already aborted", () => {
    const a = new AbortController();
    a.abort();
    const composed = anySignal([a.signal, new AbortController().signal]);
    expect(composed.aborted).toBe(true);
  });
});
