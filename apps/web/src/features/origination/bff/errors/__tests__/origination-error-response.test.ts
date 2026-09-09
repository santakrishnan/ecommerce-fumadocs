// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OriginationError } from "../origination.errors";
import { type OriginationErrorBody, originationErrorResponse } from "../origination-error-response";

describe("originationErrorResponse", () => {
  let now: number;

  beforeEach(() => {
    now = 1_234_567_890;
    vi.useFakeTimers();
    vi.setSystemTime(now);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("includes the error code and message in the response body", async () => {
    const error: OriginationError = {
      code: "UpstreamError",
      message: "Origination service returned an error",
      status: 502,
    };

    const response = originationErrorResponse(error, "trace-xyz-789");
    const body = (await response.json()) as OriginationErrorBody;

    expect(body.error.code).toBe("UpstreamError");
    expect(body.error.message).toBe("Origination service returned an error");
  });

  it("includes the traceId and current timestamp in meta", async () => {
    const error: OriginationError = {
      code: "InternalError",
      message: "An unexpected error occurred",
      status: 500,
    };

    const response = originationErrorResponse(error, "trace-abc-456");
    const body = (await response.json()) as OriginationErrorBody;

    expect(body.meta.traceId).toBe("trace-abc-456");
    expect(body.meta.timestamp).toBe(now);
  });

  it("sets the HTTP status from the error", () => {
    const error: OriginationError = {
      code: "ServiceUnavailable",
      message: "Origination upstream service is not configured",
      status: 503,
    };

    const response = originationErrorResponse(error, "trace-503");

    expect(response.status).toBe(503);
  });

  it("returns a JSON content type", () => {
    const error: OriginationError = {
      code: "ValidationFailed",
      message: "Invalid request",
      status: 400,
    };

    const response = originationErrorResponse(error, "trace-123");

    expect(response.headers.get("content-type")).toContain("application/json");
  });
});
