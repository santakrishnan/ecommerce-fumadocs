import type { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient, render } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { LocationRehydrator } from "../components/location-rehydrator";
import { LOCATION_QUERY_KEY } from "../data/constants";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

function renderRehydrator(
  zipCode: string | undefined,
  queryClient: QueryClient = createTestQueryClient()
) {
  const view = render(
    <QueryClientProvider client={queryClient}>
      <LocationRehydrator zipCode={zipCode} />
    </QueryClientProvider>
  );
  return { queryClient, ...view };
}

describe("LocationRehydrator", () => {
  it("seeds the ['location'] slice with the server-read cookie zip", () => {
    const { queryClient } = renderRehydrator("27601");

    expect(queryClient.getQueryData(LOCATION_QUERY_KEY)).toEqual({ zipCode: "27601" });
  });

  it("seeds nothing on a first visit (no cookie) so the fingerprint seed can land", () => {
    const { queryClient } = renderRehydrator(undefined);

    expect(queryClient.getQueryData(LOCATION_QUERY_KEY)).toBeUndefined();
  });

  it("never overwrites a seeded slice with an absent cookie value", () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(LOCATION_QUERY_KEY, { zipCode: "27601" });

    renderRehydrator(undefined, queryClient);

    expect(queryClient.getQueryData(LOCATION_QUERY_KEY)).toEqual({ zipCode: "27601" });
  });

  it("reconciles the slice when the cookie zip changes (post router.refresh)", () => {
    const queryClient = createTestQueryClient();
    const { rerender } = render(
      <QueryClientProvider client={queryClient}>
        <LocationRehydrator zipCode="27601" />
      </QueryClientProvider>
    );

    rerender(
      <QueryClientProvider client={queryClient}>
        <LocationRehydrator zipCode="90210" />
      </QueryClientProvider>
    );

    expect(queryClient.getQueryData(LOCATION_QUERY_KEY)).toEqual({ zipCode: "90210" });
  });
});
