// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetVehicleDetail, mockGetVehicleDeal } = vi.hoisted(() => ({
  mockGetVehicleDetail: vi.fn(),
  mockGetVehicleDeal: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@features/vehicle-detail/bff", () => ({
  getVehicleDetail: mockGetVehicleDetail,
  transformVdpToWelcomeBackShape: vi.fn(),
}));

vi.mock("../services/get-vehicle-deal", () => ({
  getVehicleDeal: mockGetVehicleDeal,
}));

import { getDealerDeal } from "../use-cases/get-dealer-deal";

const TEST_VIN = "JTERU5JR7N6123456";

describe("getDealerDeal", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockGetVehicleDetail.mockResolvedValue({
      success: false,
      error: {
        code: "VDP_UPSTREAM_UNAVAILABLE",
        message: "Vehicle detail service unavailable",
      },
    });
    mockGetVehicleDeal.mockResolvedValue({
      error: {
        code: "DEAL_NOT_FOUND",
        message: "Deal not found",
      },
    });
  });

  it("forces fixture-backed vehicle detail data", async () => {
    const result = await getDealerDeal(TEST_VIN);

    expect(mockGetVehicleDetail).toHaveBeenCalledWith({
      vin: TEST_VIN,
      visitorId: null,
      forceMock: true,
    });
    expect(result.success).toBe(false);
  });
});
