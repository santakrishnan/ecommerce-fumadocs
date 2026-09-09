// @vitest-environment node
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

const { mapCaughtToAgentError, createAgentError } = await import("../agent.errors");
const { ServerHttpError } = await import("@shared/lib/http/server-api");

describe("createAgentError", () => {
  it("returns an AgentError with the given fields", () => {
    const error = createAgentError("AGENT_INTERNAL_ERROR", "oops", 500);
    expect(error).toEqual({ code: "AGENT_INTERNAL_ERROR", message: "oops", status: 500 });
  });
});

describe("mapCaughtToAgentError", () => {
  describe("structured upstream body present", () => {
    it("preserves upstream SDK error code and message from body", () => {
      const err = new ServerHttpError("upstream error", 422, "UPSTREAM_422", "SearchAgent", {
        error: { code: "InvalidFilter", message: "Filter value is not valid" },
        meta: {},
      });
      const result = mapCaughtToAgentError(err);
      expect(result.code).toBe("InvalidFilter");
      expect(result.message).toBe("Filter value is not valid");
      expect(result.status).toBe(422);
    });

    it("preserves AgentAborted SDK code from body", () => {
      const err = new ServerHttpError("aborted", 200, "OK", "SearchAgent", {
        error: { code: "AgentAborted", message: "Agent was aborted by the user" },
        meta: {},
      });
      const result = mapCaughtToAgentError(err);
      expect(result.code).toBe("AgentAborted");
      expect(result.message).toBe("Agent was aborted by the user");
    });

    it("ignores body when error.code is not a string", () => {
      const err = new ServerHttpError("bad body", 500, "UPSTREAM_500", "SearchAgent", {
        error: { code: 42, message: "unexpected" },
      });
      const result = mapCaughtToAgentError(err);
      // Falls through to HTTP-semantic path
      expect(result.code).toBe("InternalError");
      expect(result.status).toBe(500);
    });
  });

  describe("no structured body — HTTP-semantic fallbacks", () => {
    it("timeout error (status 0, code TIMEOUT) → ServiceUnavailable, 504", () => {
      const err = new ServerHttpError("timeout", 0, "TIMEOUT", "SearchAgent");
      const result = mapCaughtToAgentError(err);
      expect(result.code).toBe("ServiceUnavailable");
      expect(result.status).toBe(504);
    });

    it("network error (status 0, non-timeout) → ServiceUnavailable, 502", () => {
      const err = new ServerHttpError("network error", 0, "NETWORK_ERROR", "SearchAgent");
      const result = mapCaughtToAgentError(err);
      expect(result.code).toBe("ServiceUnavailable");
      expect(result.status).toBe(502);
    });

    it("HTTP error with status → InternalError with passthrough status", () => {
      const err = new ServerHttpError("bad gateway", 503, "UPSTREAM_503", "SearchAgent");
      const result = mapCaughtToAgentError(err);
      expect(result.code).toBe("InternalError");
      expect(result.status).toBe(503);
    });
  });

  it("unknown non-ServerHttpError → AGENT_INTERNAL_ERROR, 500", () => {
    const result = mapCaughtToAgentError(new Error("unexpected"));
    expect(result.code).toBe("AGENT_INTERNAL_ERROR");
    expect(result.status).toBe(500);
  });
});
