// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@config/bed-services", () => ({
  resolveBedService: vi.fn(),
}));
vi.mock("../../services/patch-origination-mock", () => ({
  mockPatchOrigination: vi.fn(),
}));
vi.mock("../../services/patch-origination-upstream", () => ({
  patchOriginationUpstream: vi.fn(),
}));

import type { ResolvedBedService } from "@config/bed-services";
import { resolveBedService } from "@config/bed-services";
import type { BedVisitorIdentity } from "@shared/lib/http/bed-client";
import type { PatchOriginationRequest } from "../../contracts/patch-origination-request.schema";
import type { PatchOriginationResponse } from "../../contracts/patch-origination-response.schema";
import { mockPatchOrigination } from "../../services/patch-origination-mock";
import { patchOriginationUpstream } from "../../services/patch-origination-upstream";

const mockResolveBedService = vi.mocked(resolveBedService);
const mockMockService = vi.mocked(mockPatchOrigination);
const mockPatchUpstream = vi.mocked(patchOriginationUpstream);

const REQUEST: PatchOriginationRequest = {
  originationId: "22222222-2222-4222-8222-222222222222",
  step: "entry",
  status: "completed",
};
const TRACE_ID = "test-trace-id";
const IDENTITY: BedVisitorIdentity = { visitorId: "vis-1", sessionId: "sess-1" };

const SUCCESS_DATA: PatchOriginationResponse = {
  originationId: REQUEST.originationId,
  status: "in-progress",
  currentStep: "entry",
  completedSteps: ["entry"],
  steps: { entry: { status: "completed", updatedAt: "2026-01-01T00:00:00.000Z" } },
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const MOCK_SERVICE: ResolvedBedService = {
  serviceName: "Origination",
  baseUrl: "https://api.sandbox.arrow.toyotafinancial.com/origination/v1",
  apiKey: "test-api-key",
  tenantId: "test-tenant",
};

describe("patchOrigination", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    vi.resetModules();
  });

  it("calls upstream when the origination service is resolved", async () => {
    mockResolveBedService.mockReturnValue(MOCK_SERVICE);
    mockPatchUpstream.mockResolvedValue({ success: true, data: SUCCESS_DATA });

    const { patchOrigination } = await import("../patch-origination");
    const result = await patchOrigination(REQUEST, TRACE_ID, IDENTITY);

    expect(result.success).toBe(true);
    expect(mockResolveBedService).toHaveBeenCalledWith("origination");
    expect(mockPatchUpstream).toHaveBeenCalledWith(MOCK_SERVICE, REQUEST, TRACE_ID, IDENTITY);
    expect(mockMockService).not.toHaveBeenCalled();
  });

  it("returns mock data when USE_ORIGINATION_MOCKS is true (always wins)", async () => {
    vi.stubEnv("USE_ORIGINATION_MOCKS", "true");
    mockResolveBedService.mockReturnValue(MOCK_SERVICE);
    mockMockService.mockResolvedValue({ success: true, data: SUCCESS_DATA });

    const { patchOrigination } = await import("../patch-origination");
    const result = await patchOrigination(REQUEST, TRACE_ID, IDENTITY);

    expect(result.success).toBe(true);
    expect(mockMockService).toHaveBeenCalledWith(REQUEST);
    expect(mockResolveBedService).not.toHaveBeenCalled();
    expect(mockPatchUpstream).not.toHaveBeenCalled();
  });

  it("returns 503 ServiceUnavailable when the service is not resolved", async () => {
    mockResolveBedService.mockReturnValue(null);

    const { patchOrigination } = await import("../patch-origination");
    const result = await patchOrigination(REQUEST, TRACE_ID, IDENTITY);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("ServiceUnavailable");
      expect(result.error.status).toBe(503);
      expect(result.error.message).toContain("API_UPSTREAM_URL + ORIGINATION_API_KEY");
    }
    expect(mockPatchUpstream).not.toHaveBeenCalled();
  });

  it("propagates an upstream error Result", async () => {
    mockResolveBedService.mockReturnValue(MOCK_SERVICE);
    mockPatchUpstream.mockResolvedValue({
      success: false,
      error: { code: "UpstreamError", message: "boom", status: 502 },
    });

    const { patchOrigination } = await import("../patch-origination");
    const result = await patchOrigination(REQUEST, TRACE_ID, IDENTITY);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.code).toBe("UpstreamError");
      expect(result.error.status).toBe(502);
    }
  });
});
