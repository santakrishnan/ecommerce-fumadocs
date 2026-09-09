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

const { createOriginationError, mapCaughtToOriginationError } = await import(
  "../origination.errors"
);
const { ServerHttpError } = await import("@shared/lib/http/server-api");

describe("createOriginationError", () => {
  it("returns an OriginationError with the given fields", () => {
    const error = createOriginationError("ValidationFailed", "bad input", 400);
    expect(error).toEqual({ code: "ValidationFailed", message: "bad input", status: 400 });
  });
});

describe("mapCaughtToOriginationError", () => {
  describe("ServerHttpError — HTTP-semantic mapping", () => {
    it("timeout (status 0, code TIMEOUT) → ServiceUnavailable, 504", () => {
      const err = new ServerHttpError("timeout", 0, "TIMEOUT", "Origination");
      const result = mapCaughtToOriginationError(err);
      expect(result.code).toBe("ServiceUnavailable");
      expect(result.status).toBe(504);
    });

    it("network error (status 0, non-timeout) → ServiceUnavailable, 502", () => {
      const err = new ServerHttpError("network", 0, "NETWORK_ERROR", "Origination");
      const result = mapCaughtToOriginationError(err);
      expect(result.code).toBe("ServiceUnavailable");
      expect(result.status).toBe(502);
    });

    it("HTTP error with a real status → UpstreamError with passthrough status", () => {
      const err = new ServerHttpError("bad gateway", 503, "UPSTREAM_503", "Origination");
      const result = mapCaughtToOriginationError(err);
      expect(result.code).toBe("UpstreamError");
      expect(result.status).toBe(503);
    });

    it("does not leak the upstream body or message", () => {
      const err = new ServerHttpError("raw ssn 123-45-6789", 500, "UPSTREAM_500", "Origination", {
        ssn: "123-45-6789",
      });
      const result = mapCaughtToOriginationError(err);
      expect(result.message).toBe("Origination service returned an error");
      expect(JSON.stringify(result)).not.toContain("123-45-6789");
    });
  });

  it("unknown Error → InternalError, 500", () => {
    const result = mapCaughtToOriginationError(new Error("unexpected"));
    expect(result.code).toBe("InternalError");
    expect(result.status).toBe(500);
  });

  it("non-Error value → InternalError, 500", () => {
    const result = mapCaughtToOriginationError("a string error");
    expect(result.code).toBe("InternalError");
    expect(result.status).toBe(500);
  });
});
