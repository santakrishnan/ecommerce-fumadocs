// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SearchError } from "../search.errors";
import { type SearchErrorBody, searchErrorResponse } from "../search-error-response";

describe("searchErrorResponse", () => {
  let now: number;

  beforeEach(() => {
    now = 1_234_567_890;
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should include error code and message in response body", async () => {
    const error: SearchError = {
      code: "InternalError",
      message: "Search service returned an error",
      status: 502,
    };
    const traceId = "trace-xyz-789";

    const response = searchErrorResponse(error, traceId);
    const body = (await response.json()) as SearchErrorBody;

    expect(body.error.code).toBe("InternalError");
    expect(body.error.message).toBe("Search service returned an error");
  });

  it("should include traceId and timestamp in meta", async () => {
    const error: SearchError = {
      code: "SEARCH_INTERNAL_ERROR",
      message: "An unexpected error occurred",
      status: 500,
    };
    const traceId = "trace-abc-456";

    const response = searchErrorResponse(error, traceId);
    const body = (await response.json()) as SearchErrorBody;

    expect(body.meta.traceId).toBe("trace-abc-456");
    expect(body.meta.timestamp).toBe(now);
  });

  it("should set correct HTTP status code", () => {
    const error: SearchError = {
      code: "SEARCH_VALIDATION_FAILED",
      message: "Invalid request body",
      status: 400,
    };

    const response = searchErrorResponse(error, "trace-123");

    expect(response.status).toBe(400);
  });

  it("should set correct HTTP status for 502 Bad Gateway", () => {
    const error: SearchError = {
      code: "ServiceUnavailable",
      message: "Search service is currently unavailable",
      status: 502,
    };

    const response = searchErrorResponse(error, "trace-xyz");

    expect(response.status).toBe(502);
  });

  it("should set correct HTTP status for 504 Gateway Timeout", () => {
    const error: SearchError = {
      code: "ServiceUnavailable",
      message: "Search service request timed out",
      status: 504,
    };

    const response = searchErrorResponse(error, "trace-timeout");

    expect(response.status).toBe(504);
  });

  it("should handle SDK and BFF-only error codes", async () => {
    const errorCodes = [
      "SEARCH_VALIDATION_FAILED",
      "SEARCH_INTERNAL_ERROR",
      "ServiceUnavailable",
      "InternalError",
      "NotFound",
    ] as const;

    for (const code of errorCodes) {
      const error: SearchError = {
        code,
        message: `Error: ${code}`,
        status: 400,
      };

      const response = searchErrorResponse(error, "trace-123");
      const body = (await response.json()) as SearchErrorBody;

      expect(body.error.code).toBe(code);
    }
  });

  it("should return JSON response with correct content type", () => {
    const error: SearchError = {
      code: "SEARCH_VALIDATION_FAILED",
      message: "Invalid request",
      status: 400,
    };

    const response = searchErrorResponse(error, "trace-123");

    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("should generate timestamp matching current time", async () => {
    const error: SearchError = {
      code: "SEARCH_INTERNAL_ERROR",
      message: "Server error",
      status: 500,
    };

    const response = searchErrorResponse(error, "trace-456");
    const body = (await response.json()) as SearchErrorBody;

    expect(body.meta.timestamp).toBe(Date.now());
  });

  it("should preserve exact error message", async () => {
    const errorMessage = "Search service returned an error: connection refused";
    const error: SearchError = {
      code: "InternalError",
      message: errorMessage,
      status: 502,
    };

    const response = searchErrorResponse(error, "trace-789");
    const body = (await response.json()) as SearchErrorBody;

    expect(body.error.message).toBe(errorMessage);
  });

  it("should preserve exact traceId", async () => {
    const exactTraceId = "550e8400-e29b-41d4-a716-446655440000";
    const error: SearchError = {
      code: "SEARCH_VALIDATION_FAILED",
      message: "Invalid request",
      status: 400,
    };

    const response = searchErrorResponse(error, exactTraceId);
    const body = (await response.json()) as SearchErrorBody;

    expect(body.meta.traceId).toBe(exactTraceId);
  });
});
