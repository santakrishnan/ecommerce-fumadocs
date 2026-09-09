import { DEFAULT_ZIP_CODE, LOCATION_QUERY_KEY } from "@features/location";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@ucmp/vitest-config/test-utils";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFingerprintEnrich, useFingerprintSession } from "../use-fingerprint";

const { mockFetchFingerprintSession, mockEnrichFingerprintClient } = vi.hoisted(() => ({
  mockFetchFingerprintSession: vi.fn(),
  mockEnrichFingerprintClient: vi.fn(),
}));

vi.mock("../../services/fingerprint-client", () => ({
  fetchFingerprintSession: mockFetchFingerprintSession,
  enrichFingerprintClient: mockEnrichFingerprintClient,
}));

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useFingerprintSession", () => {
  beforeEach(() => {
    mockFetchFingerprintSession.mockReset();
  });

  it("seeds the ['location'] slice from a warm session when the slice is empty", async () => {
    mockFetchFingerprintSession.mockResolvedValue({
      hasFingerprint: true,
      visitorId: "v-123",
      zip: "27601",
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { result } = renderHook(() => useFingerprintSession(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(LOCATION_QUERY_KEY)).toEqual({ zipCode: "27601" });
  });

  it("never overwrites an existing location (manual override wins)", async () => {
    mockFetchFingerprintSession.mockResolvedValue({
      hasFingerprint: true,
      visitorId: "v-123",
      zip: "27601",
    });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(LOCATION_QUERY_KEY, { zipCode: "90210" });

    const { result } = renderHook(() => useFingerprintSession(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(LOCATION_QUERY_KEY)).toEqual({ zipCode: "90210" });
  });

  it("seeds nothing when the session has no zip (cold visit)", async () => {
    mockFetchFingerprintSession.mockResolvedValue({ hasFingerprint: false });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { result } = renderHook(() => useFingerprintSession(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(LOCATION_QUERY_KEY)).toBeUndefined();
  });
});

describe("useFingerprintEnrich", () => {
  beforeEach(() => {
    mockEnrichFingerprintClient.mockReset();
  });

  it("seeds the ['location'] slice with the enriched zip when empty", async () => {
    mockEnrichFingerprintClient.mockResolvedValue({ visitorId: "v-123", zip: "27601" });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { result } = renderHook(() => useFingerprintEnrich("req-1"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(LOCATION_QUERY_KEY)).toEqual({ zipCode: "27601" });
  });

  it("seeds the default zip when enrichment resolves without one (terminal resolver)", async () => {
    mockEnrichFingerprintClient.mockResolvedValue({ visitorId: "v-123" });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

    const { result } = renderHook(() => useFingerprintEnrich("req-1"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(LOCATION_QUERY_KEY)).toEqual({ zipCode: DEFAULT_ZIP_CODE });
  });

  it("never overwrites an existing location", async () => {
    mockEnrichFingerprintClient.mockResolvedValue({ visitorId: "v-123", zip: "27601" });
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    queryClient.setQueryData(LOCATION_QUERY_KEY, { zipCode: "90210" });

    const { result } = renderHook(() => useFingerprintEnrich("req-1"), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(queryClient.getQueryData(LOCATION_QUERY_KEY)).toEqual({ zipCode: "90210" });
  });
});
