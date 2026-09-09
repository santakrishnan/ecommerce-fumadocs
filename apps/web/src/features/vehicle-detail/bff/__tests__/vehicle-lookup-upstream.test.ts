// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { VDP_VEHICLES_BY_VIN, VDP_VINS } from "../../__fixtures__/vehicle-detail.fixtures";

vi.mock("server-only", () => ({}));
vi.mock("@shared/lib/http/bed-client", () => ({
  createBedClient: vi.fn(),
}));

import type { ResolvedBedService } from "@config/bed-services";
import { createBedClient } from "@shared/lib/http/bed-client";
import { fetchVehicleLookup } from "../services/vehicle-lookup-upstream";

const mockedCreateBedClient = vi.mocked(createBedClient);
const TEST_VIN = VDP_VINS.highlanderDefault;
// biome-ignore lint/style/noNonNullAssertion: test fixture is known to exist
const TEST_VEHICLE = VDP_VEHICLES_BY_VIN[TEST_VIN]!;

const mockPost = vi.fn();

const TEST_SERVICE: ResolvedBedService = {
  serviceName: "VehicleDetail",
  baseUrl: "https://api.example.com/vehicles/v1",
  apiKey: "test-vdp-key",
  tenantId: "toyota",
};

beforeEach(() => {
  vi.resetAllMocks();

  mockedCreateBedClient.mockReturnValue({
    delete: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    post: mockPost,
    put: vi.fn(),
  });
});

describe("fetchVehicleLookup", () => {
  it("creates a BED client with the resolved service and identity", async () => {
    mockPost.mockResolvedValue({
      data: { vehicles: [TEST_VEHICLE], notFound: [] },
    });

    await fetchVehicleLookup(TEST_SERVICE, TEST_VIN, "trace-abc", {
      visitorId: "visitor-xyz",
    });

    expect(mockedCreateBedClient).toHaveBeenCalledWith(TEST_SERVICE, {
      visitorId: "visitor-xyz",
    });
  });

  it("sends X-Trace-Id header on the POST /vehicles request", async () => {
    mockPost.mockResolvedValue({
      data: { vehicles: [TEST_VEHICLE], notFound: [] },
    });

    await fetchVehicleLookup(TEST_SERVICE, TEST_VIN, "trace-abc", {
      visitorId: "visitor-xyz",
    });

    expect(mockPost).toHaveBeenCalledWith(
      "/vehicles",
      { vins: [TEST_VIN] },
      { headers: { "X-Trace-Id": "trace-abc" } }
    );
  });

  it("passes identity to createBedClient when visitorId is null", async () => {
    mockPost.mockResolvedValue({
      data: { vehicles: [TEST_VEHICLE], notFound: [] },
    });

    await fetchVehicleLookup(TEST_SERVICE, TEST_VIN, "trace-abc", {
      visitorId: null,
    });

    expect(mockedCreateBedClient).toHaveBeenCalledWith(TEST_SERVICE, {
      visitorId: null,
    });
  });

  it("returns notFound when VIN is listed in notFound", async () => {
    mockPost.mockResolvedValue({
      data: { vehicles: [TEST_VEHICLE], notFound: [TEST_VIN] },
    });

    await expect(
      fetchVehicleLookup(TEST_SERVICE, TEST_VIN, "trace-abc", { visitorId: "visitor-xyz" })
    ).resolves.toEqual({ success: false, notFound: true });
  });

  it("returns success with vehicle data for a found VIN", async () => {
    mockPost.mockResolvedValue({
      data: { vehicles: [TEST_VEHICLE], notFound: [] },
    });

    await expect(
      fetchVehicleLookup(TEST_SERVICE, TEST_VIN, "trace-abc", { visitorId: "visitor-xyz" })
    ).resolves.toEqual({ success: true, data: TEST_VEHICLE });
  });

  it("returns notFound when vehicles array is empty", async () => {
    mockPost.mockResolvedValue({
      data: { vehicles: [], notFound: [] },
    });

    await expect(
      fetchVehicleLookup(TEST_SERVICE, TEST_VIN, "trace-abc", { visitorId: "visitor-xyz" })
    ).resolves.toEqual({ success: false, notFound: true });
  });
});
