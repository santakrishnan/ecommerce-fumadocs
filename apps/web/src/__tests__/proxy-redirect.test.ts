// @vitest-environment node
import { TRACKING_COOKIE } from "@ucmp/shared/constants";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "../proxy";

/**
 * Proxy routing tests.
 *
 * The proxy owns returning-visitor routing so the home routes can be a PPR
 * static shell: it reads the `_ucmp_last_visit_at` cookie (the edge-cheap
 * projection of the VPS `lastSeenAt`) and redirects lapsed returns to
 * `/welcome-back` and non-lapsed visitors off it — with no service call.
 */

const BASE_URL = "http://localhost:3000";
const HOUR_MS = 60 * 60 * 1000;

/** ISO timestamp `ms` in the past, relative to now. */
function isoAgo(ms: number): string {
  return new Date(Date.now() - ms).toISOString();
}

function buildRequest(path: string, cookies: Record<string, string> = {}): NextRequest {
  const request = new NextRequest(new URL(path, BASE_URL));
  for (const [name, value] of Object.entries(cookies)) {
    request.cookies.set(name, value);
  }
  return request;
}

describe("proxy — returning-visitor routing (cookie-based, no VPS call)", () => {
  describe("/ (home)", () => {
    it("passes through a first-visit (no last-visit cookie)", () => {
      const response = proxy(buildRequest("/"));
      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });

    it("passes through a recent return (< 2h)", () => {
      const response = proxy(
        buildRequest("/", { [TRACKING_COOKIE.LAST_VISIT_AT]: isoAgo(HOUR_MS) })
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });

    it("redirects a lapsed return (>= 2h) to /welcome-back", () => {
      const response = proxy(
        buildRequest("/", { [TRACKING_COOKIE.LAST_VISIT_AT]: isoAgo(3 * HOUR_MS) })
      );
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(`${BASE_URL}/welcome-back`);
    });

    it("passes through a malformed last-visit cookie (fail open)", () => {
      const response = proxy(buildRequest("/", { [TRACKING_COOKIE.LAST_VISIT_AT]: "not-a-date" }));
      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });
  });

  describe("/welcome-back", () => {
    it("keeps a lapsed return (>= 2h)", () => {
      const response = proxy(
        buildRequest("/welcome-back", {
          [TRACKING_COOKIE.LAST_VISIT_AT]: isoAgo(3 * HOUR_MS),
        })
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("location")).toBeNull();
    });

    it("redirects a non-lapsed visitor (no cookie) to /", () => {
      const response = proxy(buildRequest("/welcome-back"));
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(`${BASE_URL}/`);
    });

    it("redirects a recent return (< 2h) to /", () => {
      const response = proxy(
        buildRequest("/welcome-back", { [TRACKING_COOKIE.LAST_VISIT_AT]: isoAgo(HOUR_MS) })
      );
      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(`${BASE_URL}/`);
    });
  });

  describe("no redirect loop", () => {
    it("lapsed: / redirects to /welcome-back, which then stays put", () => {
      const cookie = { [TRACKING_COOKIE.LAST_VISIT_AT]: isoAgo(3 * HOUR_MS) };
      expect(proxy(buildRequest("/", cookie)).headers.get("location")).toBe(
        `${BASE_URL}/welcome-back`
      );
      expect(proxy(buildRequest("/welcome-back", cookie)).status).toBe(200);
    });

    it("non-lapsed: /welcome-back redirects to /, which then stays put", () => {
      expect(proxy(buildRequest("/welcome-back")).headers.get("location")).toBe(`${BASE_URL}/`);
      expect(proxy(buildRequest("/")).status).toBe(200);
    });
  });

  it("bypasses the redirect for a dev ?exp= override", () => {
    // NODE_ENV is not "production" under test, so ?exp= disables edge routing.
    const response = proxy(buildRequest("/welcome-back?exp=first-visit"));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("does not set any cookies", () => {
    const response = proxy(buildRequest("/"));
    expect(response.headers.getSetCookie()).toHaveLength(0);
  });
});
