import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@shared/lib/http/server-api", () => ({
  ServerHttpError: class ServerHttpError extends Error {
    status: number;
    code: string;
    service: string;
    body: unknown;
    constructor(message: string, status: number, code: string, service: string, body?: unknown) {
      super(message);
      this.name = "ServerHttpError";
      this.status = status;
      this.code = code;
      this.service = service;
      this.body = body;
    }
  },
}));

const { mapCaughtToSearchError, createSearchError } = await import("../search.errors");
const { ServerHttpError } = await import("@shared/lib/http/server-api");

describe("createSearchError", () => {
  it("returns a SearchError with the given fields", () => {
    const error = createSearchError("SEARCH_INTERNAL_ERROR", "oops", 500);
    expect(error).toEqual({ code: "SEARCH_INTERNAL_ERROR", message: "oops", status: 500 });
  });
});

describe("mapCaughtToSearchError", () => {
  describe("structured upstream body present", () => {
    it("preserves upstream SDK error code and message from body", () => {
      const err = new ServerHttpError("upstream error", 404, "UPSTREAM_404", "Search", {
        error: { code: "NotFound", message: "Vehicle not found" },
        meta: {},
      });
      const result = mapCaughtToSearchError(err);
      expect(result.code).toBe("NotFound");
      expect(result.message).toBe("Vehicle not found");
      expect(result.status).toBe(404);
    });

    it("preserves InvalidFilter SDK code from body", () => {
      const err = new ServerHttpError("bad request", 400, "UPSTREAM_400", "Search", {
        error: { code: "InvalidFilter", message: "Filter value out of range" },
        meta: {},
      });
      const result = mapCaughtToSearchError(err);
      expect(result.code).toBe("InvalidFilter");
      expect(result.message).toBe("Filter value out of range");
      expect(result.status).toBe(400);
    });

    it("ignores body when error.code is not a string", () => {
      const err = new ServerHttpError("bad body", 500, "UPSTREAM_500", "Search", {
        error: { code: 42, message: "unexpected" },
      });
      const result = mapCaughtToSearchError(err);
      // Falls through to HTTP-semantic path
      expect(result.code).toBe("InternalError");
      expect(result.status).toBe(500);
    });

    it("ignores body when body.error is absent", () => {
      const err = new ServerHttpError("no body error field", 503, "UPSTREAM_503", "Search", {
        message: "something went wrong",
      });
      const result = mapCaughtToSearchError(err);
      expect(result.code).toBe("InternalError");
      expect(result.status).toBe(503);
    });
  });

  describe("no structured body — HTTP-semantic fallbacks", () => {
    it("timeout error (status 0, code TIMEOUT) → ServiceUnavailable, 504", () => {
      const err = new ServerHttpError("timeout", 0, "TIMEOUT", "Search");
      const result = mapCaughtToSearchError(err);
      expect(result.code).toBe("ServiceUnavailable");
      expect(result.status).toBe(504);
    });

    it("network error (status 0, non-timeout) → ServiceUnavailable, 502", () => {
      const err = new ServerHttpError("network error", 0, "NETWORK_ERROR", "Search");
      const result = mapCaughtToSearchError(err);
      expect(result.code).toBe("ServiceUnavailable");
      expect(result.status).toBe(502);
    });

    it("HTTP error with status → InternalError with passthrough status", () => {
      const err = new ServerHttpError("bad gateway", 503, "UPSTREAM_503", "Search");
      const result = mapCaughtToSearchError(err);
      expect(result.code).toBe("InternalError");
      expect(result.status).toBe(503);
    });
  });

  it("unknown non-ServerHttpError → SEARCH_INTERNAL_ERROR, 500", () => {
    const result = mapCaughtToSearchError(new Error("unexpected"));
    expect(result.code).toBe("SEARCH_INTERNAL_ERROR");
    expect(result.status).toBe(500);
  });

  it("non-Error value → SEARCH_INTERNAL_ERROR, 500", () => {
    const result = mapCaughtToSearchError("a string error");
    expect(result.code).toBe("SEARCH_INTERNAL_ERROR");
    expect(result.status).toBe(500);
  });
});
