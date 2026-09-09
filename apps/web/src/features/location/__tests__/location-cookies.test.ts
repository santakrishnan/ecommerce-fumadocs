// @vitest-environment node
import { geoCookieOptions, locationCookieNames, zipCookieOptions } from "@config/cookies";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  parseGeoCookie,
  readLocationFromCookies,
  serializeGeo,
  truncateCoord,
  writeLocationCookies,
} from "../lib/location-cookies";

const { mockSet, mockHas, mockGet, mockCookies } = vi.hoisted(() => ({
  mockSet: vi.fn(),
  mockHas: vi.fn(),
  mockGet: vi.fn(),
  mockCookies: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: mockCookies,
}));

describe("location cookie codec", () => {
  it("truncates coordinates to 3 decimal places", () => {
    expect(truncateCoord(40.712_94)).toBe(40.713);
    expect(truncateCoord(-74.005_51)).toBe(-74.006);
    expect(truncateCoord(-90)).toBe(-90);
  });

  it("serializes to the canonical 'lat,lng' format", () => {
    expect(serializeGeo(40.712_94, -74.005_51)).toBe("40.713,-74.006");
  });

  it("round-trips through parseGeoCookie", () => {
    expect(parseGeoCookie(serializeGeo(40.713, -74.006))).toEqual({
      latitude: 40.713,
      longitude: -74.006,
    });
  });

  it("returns null for missing or malformed values", () => {
    expect(parseGeoCookie(undefined)).toBeNull();
    expect(parseGeoCookie("")).toBeNull();
    expect(parseGeoCookie("not-a-geo")).toBeNull();
    expect(parseGeoCookie("40.713")).toBeNull();
  });
});

describe("writeLocationCookies", () => {
  beforeEach(() => {
    mockSet.mockReset();
    mockHas.mockReset();
    mockCookies.mockReset();
    mockCookies.mockResolvedValue({ set: mockSet, has: mockHas });
  });

  it("writes ZIP and GEO together for a manual source", async () => {
    const written = await writeLocationCookies({
      zip: "90210",
      latitude: 34.0901,
      longitude: -118.4065,
      source: "manual",
    });

    expect(written).toBe(true);
    expect(mockSet).toHaveBeenCalledTimes(2);
    expect(mockSet).toHaveBeenNthCalledWith(1, locationCookieNames.ZIP, "90210", zipCookieOptions);
    // Math.round rounds -118406.5 toward +Infinity → -118.406.
    expect(mockSet).toHaveBeenNthCalledWith(
      2,
      locationCookieNames.GEO,
      "34.09,-118.406",
      geoCookieOptions
    );
  });

  it("manual source overwrites an existing location", async () => {
    mockHas.mockReturnValue(true);

    const written = await writeLocationCookies({
      zip: "90210",
      latitude: 34.0901,
      longitude: -118.4065,
      source: "manual",
    });

    expect(written).toBe(true);
    expect(mockSet).toHaveBeenCalledTimes(2);
  });

  it("fingerprint source seeds when no location exists", async () => {
    mockHas.mockReturnValue(false);

    const written = await writeLocationCookies({
      zip: "10001",
      latitude: 40.7484,
      longitude: -73.9967,
      source: "fingerprint",
    });

    expect(written).toBe(true);
    expect(mockHas).toHaveBeenCalledWith(locationCookieNames.ZIP);
    expect(mockSet).toHaveBeenCalledTimes(2);
  });

  it("fingerprint source never clobbers an existing location", async () => {
    mockHas.mockReturnValue(true);

    const written = await writeLocationCookies({
      zip: "10001",
      latitude: 40.7484,
      longitude: -73.9967,
      source: "fingerprint",
    });

    expect(written).toBe(false);
    expect(mockSet).not.toHaveBeenCalled();
  });
});

describe("readLocationFromCookies", () => {
  beforeEach(() => {
    mockGet.mockReset();
    mockCookies.mockReset();
    mockCookies.mockResolvedValue({ get: mockGet });
  });

  it("returns zip + coordinates when both cookies are present", async () => {
    mockGet.mockImplementation((name: string) => {
      if (name === locationCookieNames.ZIP) {
        return { value: "90210" };
      }
      if (name === locationCookieNames.GEO) {
        return { value: "34.09,-118.406" };
      }
      return;
    });

    await expect(readLocationFromCookies()).resolves.toEqual({
      zipCode: "90210",
      latitude: 34.09,
      longitude: -118.406,
    });
  });

  it("returns zip only when the GEO cookie is absent or malformed", async () => {
    mockGet.mockImplementation((name: string) =>
      name === locationCookieNames.ZIP ? { value: "10001" } : undefined
    );

    await expect(readLocationFromCookies()).resolves.toEqual({ zipCode: "10001" });
  });

  it("returns an empty object when no location cookies exist", async () => {
    mockGet.mockReturnValue(undefined);

    await expect(readLocationFromCookies()).resolves.toEqual({});
  });
});
