// @vitest-environment node
import { locationCookieNames } from "@config/cookies";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { enrichFingerprint } from "../use-cases/enrich";

const { mockCookies, mockSet, mockGet, mockGetFingerprintEvent, mockWriteLocationCookies } =
  vi.hoisted(() => ({
    mockCookies: vi.fn(),
    mockSet: vi.fn(),
    mockGet: vi.fn(),
    mockGetFingerprintEvent: vi.fn(),
    mockWriteLocationCookies: vi.fn(),
  }));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

vi.mock("../services/fingerprint-geo", () => ({
  getFingerprintEvent: mockGetFingerprintEvent,
}));

vi.mock("@features/location/server", () => ({
  writeLocationCookies: mockWriteLocationCookies,
}));

const FULL_GEO = {
  city: "New York",
  countryCode: "US",
  latitude: 40.7484,
  longitude: -73.9967,
  postalCode: "10001",
  timezone: "America/New_York",
};

describe("enrichFingerprint", () => {
  beforeEach(() => {
    mockCookies.mockReset();
    mockSet.mockReset();
    mockGet.mockReset();
    mockGetFingerprintEvent.mockReset();
    mockWriteLocationCookies.mockReset();
    mockCookies.mockResolvedValue({ set: mockSet, get: mockGet });
    mockWriteLocationCookies.mockResolvedValue(true);
  });

  it("seeds the location cookies with source 'fingerprint' when geo is complete", async () => {
    mockGetFingerprintEvent.mockResolvedValue({ visitorId: "v-123", geo: FULL_GEO });

    const result = await enrichFingerprint("req-1");

    expect(mockWriteLocationCookies).toHaveBeenCalledExactlyOnceWith({
      zip: "10001",
      latitude: 40.7484,
      longitude: -73.9967,
      source: "fingerprint",
    });
    expect(result.zip).toBe("10001");
    expect(result.coordinates).toEqual({ lat: 40.7484, lng: -73.9967 });
  });

  it("returns the existing cookie zip when the seed is skipped by an override", async () => {
    mockGetFingerprintEvent.mockResolvedValue({ visitorId: "v-123", geo: FULL_GEO });
    mockWriteLocationCookies.mockResolvedValue(false);
    mockGet.mockImplementation((name: string) =>
      name === locationCookieNames.ZIP ? { name, value: "90210" } : undefined
    );

    const result = await enrichFingerprint("req-1");

    expect(result.zip).toBe("90210");
  });

  it("writes no location cookies when geo is partial (missing postal code)", async () => {
    mockGetFingerprintEvent.mockResolvedValue({
      visitorId: "v-123",
      geo: { ...FULL_GEO, postalCode: undefined },
    });

    const result = await enrichFingerprint("req-1");

    expect(mockWriteLocationCookies).not.toHaveBeenCalled();
    expect(result.zip).toBeUndefined();
    expect(result.coordinates).toEqual({ lat: 40.7484, lng: -73.9967 });
  });

  it("writes no location cookies when geo is missing entirely", async () => {
    mockGetFingerprintEvent.mockResolvedValue({ visitorId: "v-123", geo: null });

    const result = await enrichFingerprint("req-1");

    expect(mockWriteLocationCookies).not.toHaveBeenCalled();
    expect(result.zip).toBeUndefined();
    expect(result.coordinates).toBeUndefined();
  });

  it("still writes the verified-id cookie when geo is absent", async () => {
    mockGetFingerprintEvent.mockResolvedValue({ visitorId: "v-123", geo: null });

    const result = await enrichFingerprint("req-1");

    expect(mockSet).toHaveBeenCalledTimes(1);
    expect(result.visitorId).toBe("v-123");
  });

  describe("DEV_SEED_LOCATION override", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it("uses the env var values instead of real geo when DEV_SEED_LOCATION is set", async () => {
      vi.stubEnv("DEV_SEED_LOCATION", "90210,34.074,-118.4");
      mockGetFingerprintEvent.mockResolvedValue({ visitorId: "v-123", geo: FULL_GEO });

      const result = await enrichFingerprint("req-1");

      expect(mockWriteLocationCookies).toHaveBeenCalledExactlyOnceWith({
        zip: "90210",
        latitude: 34.074,
        longitude: -118.4,
        source: "fingerprint",
      });
      expect(result.zip).toBe("90210");
      expect(result.coordinates).toEqual({ lat: 34.074, lng: -118.4 });
    });

    it("falls back to real geo when DEV_SEED_LOCATION is empty", async () => {
      vi.stubEnv("DEV_SEED_LOCATION", "");
      mockGetFingerprintEvent.mockResolvedValue({ visitorId: "v-123", geo: FULL_GEO });

      const result = await enrichFingerprint("req-1");

      expect(mockWriteLocationCookies).toHaveBeenCalledExactlyOnceWith({
        zip: "10001",
        latitude: 40.7484,
        longitude: -73.9967,
        source: "fingerprint",
      });
      expect(result.zip).toBe("10001");
    });

    it("falls back to real geo when DEV_SEED_LOCATION has invalid format", async () => {
      vi.stubEnv("DEV_SEED_LOCATION", "90210,not-a-number,-118.4");
      mockGetFingerprintEvent.mockResolvedValue({ visitorId: "v-123", geo: FULL_GEO });

      const result = await enrichFingerprint("req-1");

      expect(mockWriteLocationCookies).toHaveBeenCalledExactlyOnceWith({
        zip: "10001",
        latitude: 40.7484,
        longitude: -73.9967,
        source: "fingerprint",
      });
      expect(result.zip).toBe("10001");
    });

    it("respects manual override even when DEV_SEED_LOCATION is set", async () => {
      vi.stubEnv("DEV_SEED_LOCATION", "90210,34.074,-118.4");
      mockGetFingerprintEvent.mockResolvedValue({ visitorId: "v-123", geo: FULL_GEO });
      mockWriteLocationCookies.mockResolvedValue(false);
      mockGet.mockImplementation((name: string) =>
        name === locationCookieNames.ZIP ? { name, value: "10001" } : undefined
      );

      const result = await enrichFingerprint("req-1");

      expect(result.zip).toBe("10001");
    });
  });
});
