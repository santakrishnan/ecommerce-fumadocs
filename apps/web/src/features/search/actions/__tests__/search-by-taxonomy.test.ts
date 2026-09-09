// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockCookieStore = {
  get: vi.fn(),
};
vi.mock("next/headers", () => ({
  cookies: vi.fn(() => Promise.resolve(mockCookieStore)),
}));

vi.mock("@config/cookies", () => ({
  locationCookieNames: { ZIP: "zip", GEO: "geo" },
}));

const mockParseGeoCookie = vi.fn();
vi.mock("@features/location/lib/location-cookies", () => ({
  parseGeoCookie: (...args: unknown[]) => mockParseGeoCookie(...args),
}));

const mockGetSearchResults = vi.fn();
const mockMapInventoryCard = vi.fn();
vi.mock("@features/search/bff", () => ({
  getSearchResults: (...args: unknown[]) => mockGetSearchResults(...args),
  mapInventoryCardResponseToVehicle: (...args: unknown[]) => mockMapInventoryCard(...args),
}));

const mockReadVisitorIdentity = vi.fn();
vi.mock("@shared/lib/http/bed-identity", () => ({
  readVisitorIdentity: () => mockReadVisitorIdentity(),
}));

// ─── Import under test AFTER mocks ─────────────────────────────────────────
import { searchByTaxonomy } from "../search-by-taxonomy";

// ─── Helpers ────────────────────────────────────────────────────────────────
const VALID_VIN = "1HGCM82633A004352";

function setupDefaults() {
  mockCookieStore.get.mockImplementation((name: string) => {
    if (name === "zip") {
      return { value: "90210" };
    }
    if (name === "geo") {
      return { value: "34.0,-118.2" };
    }
    return;
  });
  mockParseGeoCookie.mockReturnValue({ latitude: 34.0, longitude: -118.2 });
  mockReadVisitorIdentity.mockResolvedValue({ visitorId: "v1", sessionId: "s1" });
}

// ─── Tests ──────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
  setupDefaults();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("searchByTaxonomy", () => {
  describe("input validation & normalization", () => {
    it("returns failure for empty VIN", async () => {
      const result = await searchByTaxonomy("");
      expect(result).toEqual({ success: false, vehicles: [] });
      expect(mockGetSearchResults).not.toHaveBeenCalled();
    });

    it("returns failure for VIN shorter than 17 characters", async () => {
      const result = await searchByTaxonomy("ABC123");
      expect(result).toEqual({ success: false, vehicles: [] });
    });

    it("returns failure for VIN longer than 17 characters", async () => {
      const result = await searchByTaxonomy("1HGCM82633A004352X");
      expect(result).toEqual({ success: false, vehicles: [] });
    });

    it("trims whitespace before validating length", async () => {
      mockGetSearchResults.mockResolvedValue({ success: true, data: { data: { results: [] } } });

      // VIN with spaces — after trim it's valid 17 chars
      await searchByTaxonomy(`  ${VALID_VIN}  `);
      expect(mockGetSearchResults).toHaveBeenCalled();
    });

    it("uppercases VIN before sending to upstream", async () => {
      mockGetSearchResults.mockResolvedValue({ success: true, data: { data: { results: [] } } });

      await searchByTaxonomy(VALID_VIN.toLowerCase());

      const callArgs = mockGetSearchResults.mock.calls[0]?.[0];
      expect(callArgs.identifierFilters[0].value).toBe(VALID_VIN.toUpperCase());
    });
  });

  describe("missing zip code", () => {
    it("returns failure when ZIP cookie is absent", async () => {
      mockCookieStore.get.mockReturnValue(undefined);

      const result = await searchByTaxonomy(VALID_VIN);
      expect(result).toEqual({ success: false, vehicles: [] });
      expect(mockGetSearchResults).not.toHaveBeenCalled();
    });
  });

  describe("upstream search failure", () => {
    it("returns failure when getSearchResults fails", async () => {
      mockGetSearchResults.mockResolvedValue({ success: false });

      const result = await searchByTaxonomy(VALID_VIN);
      expect(result).toEqual({ success: false, vehicles: [] });
    });
  });

  describe("successful search", () => {
    it("maps results and excludes source VIN", async () => {
      const cards = [
        { vin: VALID_VIN }, // source VIN — should be excluded
        { vin: "2HGCM82633A004000" },
        { vin: "3HGCM82633A004111" },
      ];
      mockGetSearchResults.mockResolvedValue({
        success: true,
        data: { data: { results: cards } },
      });
      mockMapInventoryCard.mockImplementation((card: { vin: string }) => ({
        id: card.vin,
        title: `Vehicle ${card.vin}`,
      }));

      const result = await searchByTaxonomy(VALID_VIN);

      expect(result.success).toBe(true);
      expect(result.vehicles).toHaveLength(2);
      expect(result.vehicles.map((v) => v.id)).not.toContain(VALID_VIN);
    });

    it("deduplicates vehicles by VIN", async () => {
      const cards = [
        { vin: "2HGCM82633A004000" },
        { vin: "2HGCM82633A004000" }, // duplicate
        { vin: "3HGCM82633A004111" },
      ];
      mockGetSearchResults.mockResolvedValue({
        success: true,
        data: { data: { results: cards } },
      });
      mockMapInventoryCard.mockImplementation((card: { vin: string }) => ({
        id: card.vin,
        title: `Vehicle ${card.vin}`,
      }));

      const result = await searchByTaxonomy(VALID_VIN);

      expect(result.success).toBe(true);
      expect(result.vehicles).toHaveLength(2);
    });

    it("returns empty array when all results match the source VIN", async () => {
      mockGetSearchResults.mockResolvedValue({
        success: true,
        data: { data: { results: [{ vin: VALID_VIN }] } },
      });
      mockMapInventoryCard.mockImplementation((card: { vin: string }) => ({
        id: card.vin,
      }));

      const result = await searchByTaxonomy(VALID_VIN);
      expect(result.success).toBe(true);
      expect(result.vehicles).toHaveLength(0);
    });
  });

  describe("multi-VIN support", () => {
    const SECOND_VIN = "2T36DRBV2TW021802";
    const THIRD_VIN = "5TFWA5DB1TX435010";

    it("sends values array when given multiple VINs", async () => {
      mockGetSearchResults.mockResolvedValue({ success: true, data: { data: { results: [] } } });

      await searchByTaxonomy([VALID_VIN, SECOND_VIN]);

      const callArgs = mockGetSearchResults.mock.calls[0]?.[0];
      expect(callArgs.identifierFilters[0]).toEqual({
        key: "vinTaxonomy",
        values: [VALID_VIN, SECOND_VIN],
      });
    });

    it("sends single value when given one-element array", async () => {
      mockGetSearchResults.mockResolvedValue({ success: true, data: { data: { results: [] } } });

      await searchByTaxonomy([VALID_VIN]);

      const callArgs = mockGetSearchResults.mock.calls[0]?.[0];
      expect(callArgs.identifierFilters[0]).toEqual({
        key: "vinTaxonomy",
        value: VALID_VIN,
      });
    });

    it("filters out invalid VINs from the array", async () => {
      mockGetSearchResults.mockResolvedValue({ success: true, data: { data: { results: [] } } });

      await searchByTaxonomy([VALID_VIN, "SHORT", SECOND_VIN]);

      const callArgs = mockGetSearchResults.mock.calls[0]?.[0];
      expect(callArgs.identifierFilters[0]).toEqual({
        key: "vinTaxonomy",
        values: [VALID_VIN, SECOND_VIN],
      });
    });

    it("returns failure when all VINs in array are invalid", async () => {
      const result = await searchByTaxonomy(["SHORT", "ALSO_SHORT"]);
      expect(result).toEqual({ success: false, vehicles: [] });
      expect(mockGetSearchResults).not.toHaveBeenCalled();
    });

    it("excludes all source VINs from results", async () => {
      const cards = [{ vin: VALID_VIN }, { vin: SECOND_VIN }, { vin: THIRD_VIN }];
      mockGetSearchResults.mockResolvedValue({
        success: true,
        data: { data: { results: cards } },
      });
      mockMapInventoryCard.mockImplementation((card: { vin: string }) => ({
        id: card.vin,
        title: `Vehicle ${card.vin}`,
      }));

      const result = await searchByTaxonomy([VALID_VIN, SECOND_VIN]);

      expect(result.success).toBe(true);
      expect(result.vehicles).toHaveLength(1);
      expect(result.vehicles[0]?.id).toBe(THIRD_VIN);
    });
  });
});
