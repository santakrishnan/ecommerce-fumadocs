// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { tradeInOfferResponseSchema } from "../../contracts/trade-in-offer-response.schema";
import type { TradeInRequest } from "../../contracts/trade-in-request.schema";
import { mockGetTradeInOffer } from "../get-trade-in-offer-mock";

const VIN_REQUEST: TradeInRequest = { vin: "1HGCM82633A004352" };
const PLATE_REQUEST: TradeInRequest = { plate: "ABC1234", state: "NY" };

describe("mockGetTradeInOffer", () => {
  it("returns data conforming to tradeInOfferResponseSchema", async () => {
    const result = await mockGetTradeInOffer(VIN_REQUEST);
    if (!result.success) {
      throw new Error("Expected success result");
    }
    expect(tradeInOfferResponseSchema.safeParse(result.data).success).toBe(true);
  });

  it("accepts the plate+state branch", async () => {
    const result = await mockGetTradeInOffer(PLATE_REQUEST);
    expect(result.success).toBe(true);
  });

  it("generates a fresh offerId per lookup", async () => {
    const first = await mockGetTradeInOffer(VIN_REQUEST);
    const second = await mockGetTradeInOffer(VIN_REQUEST);
    if (!(first.success && second.success)) {
      throw new Error("Expected success results");
    }
    expect(first.data.offerId).not.toBe(second.data.offerId);
  });

  it("returns an offer that expires in the future", async () => {
    const result = await mockGetTradeInOffer(VIN_REQUEST);
    if (!result.success) {
      throw new Error("Expected success result");
    }
    expect(new Date(result.data.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });
});
