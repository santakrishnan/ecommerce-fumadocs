// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockCookies, mockGet } = vi.hoisted(() => ({
  mockCookies: vi.fn(),
  mockGet: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

beforeEach(() => {
  vi.resetModules();
  mockGet.mockReset();
  mockGet.mockReturnValue(undefined);
  mockCookies.mockResolvedValue({ get: mockGet });
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

/**
 * Helper: mock the cookies().get() to return different values per cookie name.
 */
function mockCookieValues(values: Record<string, string | undefined>) {
  mockGet.mockImplementation((name: string) => {
    const value = values[name];
    return value ? { value } : undefined;
  });
}

describe("getProfileAppointment", () => {
  describe("with USE_PROFILE_APPOINTMENT_MOCKS=true", () => {
    beforeEach(() => {
      vi.stubEnv("USE_PROFILE_APPOINTMENT_MOCKS", "true");
    });

    it("returns empty array for t0 tier (section hidden)", async () => {
      mockCookieValues({});
      const { getProfileAppointment } = await import("./get-profile-appointment");
      const result = await getProfileAppointment();
      expect(result).toEqual({ success: true, data: [] });
    });

    it("returns empty array for t1 tier (section hidden)", async () => {
      mockCookieValues({ "demo-profile-tier": "t1" });
      const { getProfileAppointment } = await import("./get-profile-appointment");
      const result = await getProfileAppointment();
      expect(result).toEqual({ success: true, data: [] });
    });

    it("returns single test drive for t2 with default variant", async () => {
      mockCookieValues({ "demo-profile-tier": "t2" });
      const { getProfileAppointment } = await import("./get-profile-appointment");
      const result = await getProfileAppointment();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(1);
        expect(result.data[0]?.type).toBe("test_drive");
      }
    });

    it("returns 2-vehicle test drive when variant is test_drive_2", async () => {
      mockCookieValues({
        "demo-profile-tier": "t2",
        "demo-appointment-variant": "test_drive_2",
      });
      const { getProfileAppointment } = await import("./get-profile-appointment");
      const result = await getProfileAppointment();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.length).toBe(1);
        expect(result.data[0]?.vehicles.length).toBe(2);
      }
    });

    it("returns 3+ vehicle test drive when variant is test_drive_3plus", async () => {
      mockCookieValues({
        "demo-profile-tier": "t3",
        "demo-appointment-variant": "test_drive_3plus",
      });
      const { getProfileAppointment } = await import("./get-profile-appointment");
      const result = await getProfileAppointment();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0]?.vehicles.length).toBeGreaterThan(2);
      }
    });

    it("returns offer with appointment when variant is offer_with_appt", async () => {
      mockCookieValues({
        "demo-profile-tier": "t3",
        "demo-appointment-variant": "offer_with_appt",
      });
      const { getProfileAppointment } = await import("./get-profile-appointment");
      const result = await getProfileAppointment();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0]?.type).toBe("offer");
        expect(result.data[0]?.scheduledAt).toBeDefined();
      }
    });

    it("returns offer without appointment when variant is offer_no_appt", async () => {
      mockCookieValues({
        "demo-profile-tier": "t2",
        "demo-appointment-variant": "offer_no_appt",
      });
      const { getProfileAppointment } = await import("./get-profile-appointment");
      const result = await getProfileAppointment();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0]?.type).toBe("offer");
        expect(result.data[0]?.scheduledAt).toBeUndefined();
      }
    });

    it("returns vehicle_sold when variant is vehicle_sold", async () => {
      mockCookieValues({
        "demo-profile-tier": "t2",
        "demo-appointment-variant": "vehicle_sold",
      });
      const { getProfileAppointment } = await import("./get-profile-appointment");
      const result = await getProfileAppointment();
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0]?.type).toBe("vehicle_sold");
        expect(result.data[0]?.soldMessage).toBeDefined();
      }
    });
  });

  describe("without mocks and without upstream URL", () => {
    beforeEach(() => {
      vi.stubEnv("USE_PROFILE_APPOINTMENT_MOCKS", "false");
      vi.stubEnv("API_UPSTREAM_URL", "");
    });

    it("returns 503 error when no upstream is configured", async () => {
      const { getProfileAppointment } = await import("./get-profile-appointment");
      const result = await getProfileAppointment();
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe("PROFILE_UPSTREAM_UNAVAILABLE");
        expect(result.error.status).toBe(503);
      }
    });
  });

  describe("with upstream URL configured", () => {
    beforeEach(() => {
      vi.stubEnv("USE_PROFILE_APPOINTMENT_MOCKS", "false");
      vi.stubEnv("API_UPSTREAM_URL", "https://api.example.com");
    });

    it("returns empty data from the stub upstream", async () => {
      const { getProfileAppointment } = await import("./get-profile-appointment");
      const result = await getProfileAppointment();
      expect(result).toEqual({ success: true, data: [] });
    });
  });
});
