// @vitest-environment node
import { describe, expect, it } from "vitest";
import { financingRatesFixture } from "../__fixtures__/financing-rates.fixture";
import { FixtureFinancingRateService } from "../services/financing-rate-service";

describe("FixtureFinancingRateService", () => {
  it("returns the credit score tiers from the fixture", async () => {
    const service = new FixtureFinancingRateService();
    const tiers = await service.getCreditScoreTiers();
    expect(tiers).toEqual(financingRatesFixture);
  });

  it("returns tiers with correct shape", async () => {
    const service = new FixtureFinancingRateService();
    const tiers = await service.getCreditScoreTiers();
    for (const tier of tiers) {
      expect(tier).toHaveProperty("label");
      expect(tier).toHaveProperty("scoreRange");
      expect(tier).toHaveProperty("apr");
      expect(typeof tier.label).toBe("string");
      expect(typeof tier.scoreRange).toBe("string");
      expect(typeof tier.apr).toBe("number");
    }
  });

  it("APR values match the fixture", async () => {
    const service = new FixtureFinancingRateService();
    const tiers = await service.getCreditScoreTiers();
    expect(tiers[0]?.apr).toBe(0.045);
    expect(tiers[1]?.apr).toBe(0.065);
    expect(tiers[2]?.apr).toBe(0.095);
    expect(tiers[3]?.apr).toBe(0.149);
  });

  it("service is swappable — different implementation returns different data", async () => {
    const customService = {
      async getCreditScoreTiers() {
        return [{ label: "Custom", scoreRange: "800+", apr: 0.03 }];
      },
    };
    const tiers = await customService.getCreditScoreTiers();
    expect(tiers).toHaveLength(1);
    expect(tiers[0]?.label).toBe("Custom");
  });
});
