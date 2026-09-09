// @vitest-environment node
import { ServerHttpError } from "@shared/lib/http/server-api";
import {
  HTTP_STATUS_BAD_GATEWAY,
  HTTP_STATUS_BAD_REQUEST,
  HTTP_STATUS_GATEWAY_TIMEOUT,
  HTTP_STATUS_INTERNAL_SERVER_ERROR,
  HTTP_STATUS_NOT_FOUND,
} from "@shared/lib/http/status-codes";
import { describe, expect, it } from "vitest";
import { mapCaughtToVdpError } from "../errors/vdp.errors";

describe("mapCaughtToVdpError", () => {
  it("maps upstream 404 errors to VDP_NOT_FOUND", () => {
    const error = new ServerHttpError("not found", 404, "NOT_FOUND", "VDP-Vehicle");

    const result = mapCaughtToVdpError(error);

    expect(result).toEqual({
      code: "VDP_NOT_FOUND",
      message: "Vehicle not found upstream",
      status: HTTP_STATUS_NOT_FOUND,
    });
  });

  it("preserves 400 errors as VDP_UPSTREAM_UNAVAILABLE with 400 status", () => {
    const error = new ServerHttpError("bad request", 400, "BAD_REQUEST", "VDP-Vehicle");

    const result = mapCaughtToVdpError(error);

    expect(result).toEqual({
      code: "VDP_UPSTREAM_UNAVAILABLE",
      message: "Vehicle lookup service returned an error",
      status: HTTP_STATUS_BAD_REQUEST,
    });
  });

  it("preserves 403 errors as VDP_UPSTREAM_UNAVAILABLE with 403 status", () => {
    const error = new ServerHttpError("forbidden", 403, "FORBIDDEN", "VDP-Vehicle");

    const result = mapCaughtToVdpError(error);

    expect(result).toEqual({
      code: "VDP_UPSTREAM_UNAVAILABLE",
      message: "Vehicle lookup service returned an error",
      status: 403,
    });
  });

  it("maps 500 errors to VDP_UPSTREAM_UNAVAILABLE with 502 status", () => {
    const error = new ServerHttpError("internal", 500, "INTERNAL_ERROR", "VDP-Vehicle");

    const result = mapCaughtToVdpError(error);

    expect(result).toEqual({
      code: "VDP_UPSTREAM_UNAVAILABLE",
      message: "Vehicle lookup service returned an error",
      status: HTTP_STATUS_BAD_GATEWAY,
    });
  });

  it("maps timeout transport errors to VDP_UPSTREAM_TIMEOUT", () => {
    const error = new ServerHttpError("timeout", 0, "TIMEOUT", "VDP-Vehicle");

    const result = mapCaughtToVdpError(error);

    expect(result).toEqual({
      code: "VDP_UPSTREAM_TIMEOUT",
      message: "Vehicle lookup service request timed out",
      status: HTTP_STATUS_GATEWAY_TIMEOUT,
    });
  });

  it("maps network errors to VDP_UPSTREAM_UNAVAILABLE", () => {
    const error = new ServerHttpError("network error", 0, "NETWORK_ERROR", "VDP-Vehicle");

    const result = mapCaughtToVdpError(error);

    expect(result).toEqual({
      code: "VDP_UPSTREAM_UNAVAILABLE",
      message: "Vehicle lookup service is currently unavailable",
      status: HTTP_STATUS_BAD_GATEWAY,
    });
  });

  it("maps unknown errors to VDP_INTERNAL_ERROR", () => {
    const result = mapCaughtToVdpError(new Error("unknown"));

    expect(result).toEqual({
      code: "VDP_INTERNAL_ERROR",
      message: "An unexpected error occurred",
      status: HTTP_STATUS_INTERNAL_SERVER_ERROR,
    });
  });
});
