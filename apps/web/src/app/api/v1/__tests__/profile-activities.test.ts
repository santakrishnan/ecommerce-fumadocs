// @vitest-environment node
import type { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("server-only", () => ({}));

const mockRecordActivity = vi.fn();
vi.mock("~/features/profile/activities/bff", () => ({
  activityEventSchema: {
    safeParse: (data: unknown) => {
      const d = data as Record<string, unknown>;
      if (!d || typeof d.type !== "string" || !d.type.startsWith("visitorActivity.")) {
        return { success: false, error: { issues: [{ message: "Invalid type" }] } };
      }
      return { success: true, data: d };
    },
  },
  activitiesErrorResponse: vi.fn((error: { code: string; message: string; status: number }) => {
    const { NextResponse } = require("next/server");
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.status }
    );
  }),
  recordActivity: (...args: unknown[]) => mockRecordActivity(...args),
}));

// ─── Legacy feature-service tests (still passing — independent of route) ────

const ACTIVITY_ID_REGEX = /^act_[a-z0-9]{6}$/;

function expectErrorResponse(
  response: Awaited<
    ReturnType<
      typeof import("@features/landing/bff/services/get-profile-activity-response").getProfileActivityResponse
    >
  >
) {
  expect("error" in response).toBe(true);
  if (!("error" in response)) {
    throw new Error("Expected an error response");
  }
  return response.error;
}

function expectActivityResponse(
  response: Awaited<
    ReturnType<
      typeof import("@features/landing/bff/services/get-profile-activity-response").getProfileActivityResponse
    >
  >
) {
  expect("error" in response).toBe(false);
  if ("error" in response) {
    throw new Error(`Expected an activity response, received ${response.error.code}`);
  }
  return response;
}

function createRequest(body: unknown, throwOnJson = false): NextRequest {
  return {
    json: throwOnJson
      ? async () => {
          throw new Error("invalid-json");
        }
      : async () => body,
    headers: new Headers(),
  } as unknown as NextRequest;
}

describe("POST /api/v1/profile/activities", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    mockRecordActivity.mockReset();
  });

  describe("validation via feature service", () => {
    it("returns validation error for missing required fields", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
      const { getProfileActivityResponse } = await import(
        "@features/landing/bff/services/get-profile-activity-response"
      );

      const response = await getProfileActivityResponse({
        activityType: "budget-calculator",
        payload: {
          downPayment: 3500,
        },
      });

      const error = expectErrorResponse(response);
      expect(error.code).toBe("PROFILE_ACTIVITY_VALIDATION_FAILED");
      expect(error.message).toBe("Activity payload did not match contract.");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[getProfileActivityResponse] Invalid request payload",
        expect.any(Array)
      );
      consoleErrorSpy.mockRestore();
    });

    it("returns validation error for wrong activityType", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
      const { getProfileActivityResponse } = await import(
        "@features/landing/bff/services/get-profile-activity-response"
      );

      const response = await getProfileActivityResponse({
        activityType: "wrong-type",
        payload: {
          downPayment: 3500,
          monthlyPayment: 250,
        },
      });

      const error = expectErrorResponse(response);
      expect(error.code).toBe("PROFILE_ACTIVITY_VALIDATION_FAILED");
      consoleErrorSpy.mockRestore();
    });

    it("returns recorded response for valid budget-calculator activity", async () => {
      const { getProfileActivityResponse } = await import(
        "@features/landing/bff/services/get-profile-activity-response"
      );

      const response = await getProfileActivityResponse({
        activityType: "budget-calculator",
        payload: {
          downPayment: 3500,
          monthlyPayment: 250,
        },
      });

      const activity = expectActivityResponse(response);
      expect(activity.status).toBe("recorded");
      if (activity.status !== "recorded") {
        throw new Error("Expected a recorded activity response");
      }
      expect(activity.activityId).toMatch(ACTIVITY_ID_REGEX);
      expect(Number.isNaN(new Date(activity.recordedAt).getTime())).toBe(false);
    });

    it("returns queued degraded response when profile capture is unavailable", async () => {
      vi.stubEnv("PROFILE_ACTIVITY_MODE", "queued");

      const { getProfileActivityResponse } = await import(
        "@features/landing/bff/services/get-profile-activity-response"
      );

      const response = await getProfileActivityResponse({
        activityType: "budget-calculator",
        payload: {
          downPayment: 3500,
          monthlyPayment: 250,
        },
      });

      const activity = expectActivityResponse(response);
      expect(activity.status).toBe("queued");
      if (activity.status !== "queued") {
        throw new Error("Expected a queued activity response");
      }
      expect(activity.activityId).toBe(null);
      expect(activity.warnings).toContain("profile-unavailable");
    });
  });

  describe("route handler orchestration", () => {
    it("returns 400 for malformed JSON", async () => {
      const { POST } = await import("~/app/api/v1/profile/activities/route");

      const response = await POST(createRequest(null, true));

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("BadRequest");
    });

    it("returns 400 for invalid activity type", async () => {
      const { POST } = await import("~/app/api/v1/profile/activities/route");

      const response = await POST(createRequest({ type: "invalid.event.type", visitorId: "test" }));

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.error.code).toBe("BadRequest");
    });

    it("returns 202 with accepted envelope for valid activity", async () => {
      mockRecordActivity.mockResolvedValue({
        success: true,
        data: { accepted: true },
      });

      const { POST } = await import("~/app/api/v1/profile/activities/route");

      const response = await POST(
        createRequest({
          type: "visitorActivity.vehicle.viewed",
          visitorId: "dd07a7b4-e73c-470a-a028-4174307c7794",
          sessionId: "d6669912-1cd7-40ba-869d-d463942bcbb7",
          vehicle: { vin: "4T1C11AK3PU174630", title: "2023 Toyota Camry LE" },
        })
      );

      expect(response.status).toBe(202);
      const body = await response.json();
      expect(body.data.accepted).toBe(true);
      expect(body.meta).toHaveProperty("traceId");
      expect(body.meta).toHaveProperty("timestamp");
    });

    it("returns error status when upstream fails", async () => {
      mockRecordActivity.mockResolvedValue({
        success: false,
        error: { code: "InternalError", message: "Service unavailable", status: 503 },
      });

      const { POST } = await import("~/app/api/v1/profile/activities/route");

      const response = await POST(
        createRequest({
          type: "visitorActivity.page.viewed",
          visitorId: "dd07a7b4-e73c-470a-a028-4174307c7794",
          sessionId: "d6669912-1cd7-40ba-869d-d463942bcbb7",
          pageType: "vdp",
        })
      );

      expect(response.status).toBe(503);
      const body = await response.json();
      expect(body.error.code).toBe("InternalError");
    });
  });
});
