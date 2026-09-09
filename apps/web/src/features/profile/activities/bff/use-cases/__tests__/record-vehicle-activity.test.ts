// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────────────

vi.mock("server-only", () => ({}));

const mockReadVisitorIdentity = vi.fn();
vi.mock("@shared/lib/http/bed-identity", () => ({
  readVisitorIdentity: () => mockReadVisitorIdentity(),
}));

const mockRecordActivity = vi.fn();
vi.mock("../activities", () => ({
  recordActivity: (...args: unknown[]) => mockRecordActivity(...args),
}));

// ─── Import under test AFTER mocks ──────────────────────────────────────────
import { recordVehicleActivity } from "../record-vehicle-activity";

// ─── Helpers ────────────────────────────────────────────────────────────────

const RESOLVED_IDENTITY = { visitorId: "v-abc", sessionId: "s-xyz" };

const VEHICLE_REF = {
  vin: "1HGBH41JXMN109186",
  title: "2025 Toyota RAV4 Hybrid XLE",
  year: 2025,
  make: "Toyota",
  model: "RAV4",
  trim: "Hybrid XLE",
  listPrice: 38_000,
  mileage: 5000,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockReadVisitorIdentity.mockResolvedValue(RESOLVED_IDENTITY);
  mockRecordActivity.mockResolvedValue({ success: true, data: { accepted: true } });
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("recordVehicleActivity", () => {
  describe("identity injection", () => {
    it("merges server-read visitorId and sessionId into the event before forwarding", async () => {
      await recordVehicleActivity({
        type: "visitorActivity.vehicle.clicked",
        vehicle: VEHICLE_REF,
        source: "Srp",
      });

      expect(mockRecordActivity).toHaveBeenCalledTimes(1);
      expect(mockRecordActivity).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "visitorActivity.vehicle.clicked",
          visitorId: "v-abc",
          sessionId: "s-xyz",
          vehicle: VEHICLE_REF,
          source: "Srp",
        })
      );
    });

    it("forwards all four vehicle event types correctly", async () => {
      const events = [
        {
          type: "visitorActivity.vehicle.clicked" as const,
          vehicle: VEHICLE_REF,
          source: "Srp" as const,
        },
        {
          type: "visitorActivity.vehicle.viewed" as const,
          vehicle: VEHICLE_REF,
          source: "Vdp" as const,
        },
        {
          type: "visitorActivity.vehicle.bookmarked" as const,
          vehicle: VEHICLE_REF,
        },
        {
          type: "visitorActivity.vehicle.unbookmarked" as const,
          vehicle: VEHICLE_REF,
        },
      ];

      for (const event of events) {
        vi.clearAllMocks();
        mockRecordActivity.mockResolvedValue({ success: true, data: { accepted: true } });

        await recordVehicleActivity(event);

        expect(mockRecordActivity).toHaveBeenCalledTimes(1);
        expect(mockRecordActivity).toHaveBeenCalledWith(
          expect.objectContaining({
            type: event.type,
            visitorId: "v-abc",
            sessionId: "s-xyz",
          })
        );
      }
    });
  });

  describe("unresolved identity", () => {
    it("skips when both visitorId and sessionId are null (anonymous visit)", async () => {
      mockReadVisitorIdentity.mockResolvedValue({ visitorId: null, sessionId: null });

      await recordVehicleActivity({
        type: "visitorActivity.vehicle.clicked",
        vehicle: VEHICLE_REF,
        source: "Srp",
      });

      expect(mockRecordActivity).not.toHaveBeenCalled();
    });

    it("skips when only sessionId is missing", async () => {
      mockReadVisitorIdentity.mockResolvedValue({ visitorId: "v-abc", sessionId: null });

      await recordVehicleActivity({
        type: "visitorActivity.vehicle.clicked",
        vehicle: VEHICLE_REF,
        source: "Srp",
      });

      expect(mockRecordActivity).not.toHaveBeenCalled();
    });

    it("skips when only visitorId is missing", async () => {
      mockReadVisitorIdentity.mockResolvedValue({ visitorId: null, sessionId: "s-xyz" });

      await recordVehicleActivity({
        type: "visitorActivity.vehicle.clicked",
        vehicle: VEHICLE_REF,
        source: "Srp",
      });

      expect(mockRecordActivity).not.toHaveBeenCalled();
    });
  });

  describe("upstream failure results", () => {
    it("does not throw when recordActivity returns a failure result", async () => {
      mockRecordActivity.mockResolvedValue({
        success: false,
        error: { code: "InternalError", message: "upstream error", status: 503 },
      });

      await expect(
        recordVehicleActivity({
          type: "visitorActivity.vehicle.bookmarked",
          vehicle: VEHICLE_REF,
        })
      ).resolves.toBeUndefined();
    });

    it("still calls recordActivity once even when result is a failure", async () => {
      mockRecordActivity.mockResolvedValue({
        success: false,
        error: { code: "BadGateway", message: "bad gateway", status: 502 },
      });

      await recordVehicleActivity({
        type: "visitorActivity.vehicle.unbookmarked",
        vehicle: VEHICLE_REF,
      });

      expect(mockRecordActivity).toHaveBeenCalledTimes(1);
    });
  });

  describe("thrown dependencies (fire-and-forget contract)", () => {
    it("never throws when recordActivity rejects", async () => {
      mockRecordActivity.mockRejectedValue(new Error("upstream down"));

      await expect(
        recordVehicleActivity({
          type: "visitorActivity.vehicle.clicked",
          vehicle: VEHICLE_REF,
          source: "ConversationalSearch",
        })
      ).resolves.toBeUndefined();
    });

    it("never throws when readVisitorIdentity rejects", async () => {
      mockReadVisitorIdentity.mockRejectedValue(new Error("cookies unavailable"));

      await expect(
        recordVehicleActivity({
          type: "visitorActivity.vehicle.viewed",
          vehicle: VEHICLE_REF,
          source: "Vdp",
        })
      ).resolves.toBeUndefined();

      expect(mockRecordActivity).not.toHaveBeenCalled();
    });
  });
});
