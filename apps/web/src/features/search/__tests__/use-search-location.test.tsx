import type { FingerprintContextValue } from "@features/fingerprint";
import { DEFAULT_ZIP_CODE, LOCATION_QUERY_KEY } from "@features/location";
import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient, renderHook } from "@ucmp/vitest-config/test-utils";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSearchLocation } from "../hooks/use-search-location";

const mockUseFingerprint = vi.fn<() => FingerprintContextValue>();

vi.mock("@features/fingerprint", () => ({
  useFingerprint: () => mockUseFingerprint(),
}));

function base(overrides: Partial<FingerprintContextValue> = {}): FingerprintContextValue {
  return {
    isError: false,
    isLoading: false,
    isReady: true,
    requestId: null,
    ...overrides,
  };
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useSearchLocation", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    mockUseFingerprint.mockReset();
    queryClient = createTestQueryClient();
  });

  it("returns full location + filterLocation when coordinates are resolved", () => {
    mockUseFingerprint.mockReturnValue(
      base({ zip: "90210", coordinates: { lat: 34.09, lng: -118.41 } })
    );
    queryClient.setQueryData(LOCATION_QUERY_KEY, { zipCode: "90210" });

    const { result } = renderHook(() => useSearchLocation(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.location).toEqual({
      zipCode: "90210",
      latitude: 34.09,
      longitude: -118.41,
    });
    expect(result.current.filterLocation).toEqual({
      zipCode: "90210",
      latitude: 34.09,
      longitude: -118.41,
    });
  });

  it("returns a zip-only location and no filterLocation when coordinates are absent", () => {
    mockUseFingerprint.mockReturnValue(base({ zip: "60601" }));
    queryClient.setQueryData(LOCATION_QUERY_KEY, { zipCode: "60601" });

    const { result } = renderHook(() => useSearchLocation(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.location).toEqual({ zipCode: "60601" });
    expect(result.current.location.latitude).toBeUndefined();
    expect(result.current.location.longitude).toBeUndefined();
    expect(result.current.filterLocation).toBeUndefined();
  });

  it("falls back to DEFAULT_ZIP_CODE when the location cache has no zip", () => {
    mockUseFingerprint.mockReturnValue(base());

    const { result } = renderHook(() => useSearchLocation(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.location.zipCode).toBe(DEFAULT_ZIP_CODE);
    expect(result.current.filterLocation).toBeUndefined();
  });

  it("uses zip from location cache even when fingerprint has a different zip", () => {
    // Simulates the user changing their zip after fingerprint resolution
    mockUseFingerprint.mockReturnValue(
      base({ zip: "10001", coordinates: { lat: 40.75, lng: -73.99 } })
    );
    queryClient.setQueryData(LOCATION_QUERY_KEY, { zipCode: "90210" });

    const { result } = renderHook(() => useSearchLocation(), {
      wrapper: createWrapper(queryClient),
    });

    // Should use the cache zip (90210), not the fingerprint zip (10001)
    expect(result.current.location.zipCode).toBe("90210");
    expect(result.current.location.latitude).toBe(40.75);
    expect(result.current.location.longitude).toBe(-73.99);
  });
});
