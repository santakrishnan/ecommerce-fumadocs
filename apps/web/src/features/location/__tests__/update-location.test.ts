// @vitest-environment node
import { geoCookieOptions, locationCookieNames, zipCookieOptions } from "@config/cookies";
import { LOCATION_DEFAULTS } from "@ucmp/shared/constants";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateLocationFromCoords, updateZipCode } from "../services/update-location";

const { mockSet, mockHas, mockCookies, mockGetGeoFromZip, mockGetGeoFromCoords } = vi.hoisted(
  () => ({
    mockSet: vi.fn(),
    mockHas: vi.fn(),
    mockCookies: vi.fn(),
    mockGetGeoFromZip: vi.fn(),
    mockGetGeoFromCoords: vi.fn(),
  })
);

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

vi.mock("@features/geo/bff", () => ({
  getGeoFromZip: mockGetGeoFromZip,
  getGeoFromCoords: mockGetGeoFromCoords,
}));

const beverlyHills = {
  city: "Beverly Hills",
  state: "California",
  stateCode: "CA",
  zip: "90210",
  latitude: 34.0901,
  longitude: -118.4065,
};

const newYork = {
  city: "New York",
  state: "New York",
  stateCode: "NY",
  zip: LOCATION_DEFAULTS.ZIP,
  latitude: LOCATION_DEFAULTS.LAT,
  longitude: LOCATION_DEFAULTS.LNG,
};

describe("update-location actions", () => {
  beforeEach(() => {
    mockSet.mockReset();
    mockHas.mockReset();
    mockCookies.mockReset();
    mockCookies.mockResolvedValue({ set: mockSet, has: mockHas });
    mockGetGeoFromZip.mockReset();
    mockGetGeoFromCoords.mockReset();
    mockGetGeoFromZip.mockResolvedValue({ success: true, data: beverlyHills });
    mockGetGeoFromCoords.mockResolvedValue({ success: true, data: newYork });
  });

  describe("updateZipCode", () => {
    it("returns an error and does not write cookies when ZIP is invalid", async () => {
      const result = await updateZipCode("123");

      expect(result).toEqual({ success: false, error: "ZIP code must be exactly 5 digits." });
      expect(mockSet).not.toHaveBeenCalled();
      expect(mockGetGeoFromZip).not.toHaveBeenCalled();
    });

    it("resolves geo in-process and writes ZIP and GEO cookies together", async () => {
      const result = await updateZipCode("90210");

      expect(mockGetGeoFromZip).toHaveBeenCalledExactlyOnceWith({ zip: "90210" });
      expect(result).toEqual({
        success: true,
        zip: "90210",
        city: "Beverly Hills",
        stateCode: "CA",
      });
      expect(mockSet).toHaveBeenCalledTimes(2);
      expect(mockSet).toHaveBeenNthCalledWith(
        1,
        locationCookieNames.ZIP,
        "90210",
        zipCookieOptions
      );
      // Math.round rounds -118406.5 toward +Infinity → -118.406.
      expect(mockSet).toHaveBeenNthCalledWith(
        2,
        locationCookieNames.GEO,
        "34.09,-118.406",
        geoCookieOptions
      );
    });

    it("overwrites an existing location (manual source always wins)", async () => {
      mockHas.mockReturnValue(true);

      const result = await updateZipCode("90210");

      expect(result.success).toBe(true);
      expect(mockSet).toHaveBeenCalledTimes(2);
    });

    it("returns the geo error and does not write cookies when the lookup fails", async () => {
      mockGetGeoFromZip.mockResolvedValue({
        success: false,
        error: {
          code: "GEO_UPSTREAM_ERROR",
          message: "Geo service returned an error",
          status: 502,
        },
      });

      const result = await updateZipCode("99999");

      expect(result).toEqual({
        success: false,
        error: "We couldn't look up that location. Please try again.",
      });
      expect(mockSet).not.toHaveBeenCalled();
    });
  });

  describe("updateLocationFromCoords", () => {
    it("returns an error and does not write cookies when coordinates are invalid", async () => {
      const result = await updateLocationFromCoords(95, -74.006);

      expect(result).toEqual({ success: false, error: "Invalid coordinates." });
      expect(mockSet).not.toHaveBeenCalled();
      expect(mockGetGeoFromCoords).not.toHaveBeenCalled();
    });

    it("truncates coordinates before resolving and persists the user's position", async () => {
      const result = await updateLocationFromCoords(40.712_94, -74.005_51);

      expect(mockGetGeoFromCoords).toHaveBeenCalledExactlyOnceWith({
        latitude: 40.713,
        longitude: -74.006,
      });
      expect(result).toEqual({
        success: true,
        zip: LOCATION_DEFAULTS.ZIP,
        city: "New York",
        stateCode: "NY",
      });
      expect(mockSet).toHaveBeenCalledTimes(2);
      expect(mockSet).toHaveBeenNthCalledWith(
        1,
        locationCookieNames.ZIP,
        LOCATION_DEFAULTS.ZIP,
        zipCookieOptions
      );
      // GEO keeps the visitor's truncated coordinates, not the resolved city's.
      expect(mockSet).toHaveBeenNthCalledWith(
        2,
        locationCookieNames.GEO,
        "40.713,-74.006",
        geoCookieOptions
      );
    });

    it("accepts boundary coordinates and serializes them to 3 decimals", async () => {
      const result = await updateLocationFromCoords(-90, 180);

      expect(result.success).toBe(true);
      expect(mockSet).toHaveBeenNthCalledWith(
        2,
        locationCookieNames.GEO,
        "-90,180",
        geoCookieOptions
      );
    });

    it("returns the geo error and does not write cookies when the reverse lookup fails", async () => {
      mockGetGeoFromCoords.mockResolvedValue({
        success: false,
        error: {
          code: "GEO_UPSTREAM_UNAVAILABLE",
          message: "Geo service is currently unavailable",
          status: 502,
        },
      });

      const result = await updateLocationFromCoords(40.713, -74.006);

      expect(result).toEqual({
        success: false,
        error: "Location service is temporarily unavailable. Please try again later.",
      });
      expect(mockSet).not.toHaveBeenCalled();
    });
  });
});
