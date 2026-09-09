// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  VDP_RESPONSE_DEFAULT_FIXTURE,
  VDP_RESPONSE_ESTIMATE_FIXTURE,
  VDP_RESPONSE_EXPIRED_FIXTURE,
  VDP_RESPONSE_OFFER_FIXTURE,
  VDP_RESPONSE_SOLD_FIXTURE,
} from "../bff/__fixtures__/vdp-response.fixture";
import {
  detectCardState,
  toPurchaseCardFromApi,
  toSoldCardFromApi,
} from "../mappers/to-purchase-card-from-api";

const RE_EXPIRES_IN = /Expires in \d+d, \d+h/;
const RE_HTTP_URL = /^https?:\/\//;
const RE_IMAGES_PATH = /^\/images\//;

describe("detectCardState", () => {
  it("returns 'active' for an in-stock vehicle", () => {
    expect(detectCardState(VDP_RESPONSE_DEFAULT_FIXTURE)).toBe("active");
  });

  it("returns 'active' for an estimate state vehicle", () => {
    expect(detectCardState(VDP_RESPONSE_ESTIMATE_FIXTURE)).toBe("active");
  });

  it("returns 'active' for an offer state vehicle", () => {
    expect(detectCardState(VDP_RESPONSE_OFFER_FIXTURE)).toBe("active");
  });

  it("returns 'active' for an expired state vehicle", () => {
    expect(detectCardState(VDP_RESPONSE_EXPIRED_FIXTURE)).toBe("active");
  });

  it("returns 'sold' for a sold vehicle", () => {
    expect(detectCardState(VDP_RESPONSE_SOLD_FIXTURE)).toBe("sold");
  });
});

describe("toPurchaseCardFromApi", () => {
  describe("S1 — Generic (no origination)", () => {
    it("maps vehicle data correctly", () => {
      const result = toPurchaseCardFromApi(VDP_RESPONSE_DEFAULT_FIXTURE, "false");

      expect(result.vehicle.make).toBe("Toyota");
      expect(result.vehicle.model).toBe("Highlander");
      expect(result.vehicle.trim).toBe("Hybrid Limited");
      expect(result.vehicle.year).toBe(2023);
      expect(result.vehicle.mileage).toBe(36_435);
      // Price resolved via computed.effectivePrice (sellingPrice in fixture)
      expect(result.vehicle.price).toBe(30_775);
      expect(result.vehicle.msrp).toBe(31_775);
    });

    it("returns default payment state", () => {
      const result = toPurchaseCardFromApi(VDP_RESPONSE_DEFAULT_FIXTURE, "false");

      expect(result.paymentState).toEqual({ kind: "default" });
    });

    it("maps dealer address from extended data", () => {
      const result = toPurchaseCardFromApi(VDP_RESPONSE_DEFAULT_FIXTURE, "false");

      expect(result.dealer.name).toBe("Toyota of Bay Ridge");
      expect(result.dealer.address).toContain("6401 6th Ave");
      expect(result.dealer.address).toContain("Brooklyn");
      expect(result.dealer.address).toContain("NY");
      expect(result.dealer.address).toContain("11220");
    });

    it("uses the card map thumbnail from the API response", () => {
      const result = toPurchaseCardFromApi(VDP_RESPONSE_DEFAULT_FIXTURE, "false");

      expect(result.dealer.mapThumbnailUrl).toContain("/images/vdp/purchase-card-map.png");
    });

    it("shows 'Below market' badge when belowMarket is true", () => {
      const result = toPurchaseCardFromApi(VDP_RESPONSE_DEFAULT_FIXTURE, "false");

      expect(result.badgeLabel).toBe("Below market");
      expect(result.badgeIconName).toBe("price-tag-filled");
    });

    it("shows 'Gold Certified' badge for gold certification", () => {
      const result = toPurchaseCardFromApi(VDP_RESPONSE_DEFAULT_FIXTURE, "gold");

      expect(result.badgeLabel).toBe("Gold Certified");
      expect(result.badgeIconName).toBeUndefined();
    });

    it("shows 'Silver Certified' badge for silver certification", () => {
      const result = toPurchaseCardFromApi(VDP_RESPONSE_DEFAULT_FIXTURE, "silver");

      expect(result.badgeLabel).toBe("Silver Certified");
      expect(result.badgeIconName).toBeUndefined();
    });
  });

  describe("S2 — Estimated Payment", () => {
    it("maps estimated payment state", () => {
      const result = toPurchaseCardFromApi(VDP_RESPONSE_ESTIMATE_FIXTURE, "false");

      expect(result.paymentState).toEqual({
        kind: "estimated",
        monthlyPayment: 456.97,
        downPayment: 3500,
      });
    });

    it("maps RAV4 vehicle data", () => {
      const result = toPurchaseCardFromApi(VDP_RESPONSE_ESTIMATE_FIXTURE, "false");

      expect(result.vehicle.make).toBe("Toyota");
      expect(result.vehicle.model).toBe("RAV4");
      expect(result.vehicle.trim).toBe("Hybrid XSE");
      expect(result.vehicle.year).toBe(2024);
    });
  });

  describe("S3 — Offer Received", () => {
    it("maps active offer payment state", () => {
      const result = toPurchaseCardFromApi(VDP_RESPONSE_OFFER_FIXTURE, "false");

      expect(result.paymentState.kind).toBe("active");
      if (result.paymentState.kind === "active") {
        expect(result.paymentState.monthlyPayment).toBe(297);
        expect(result.paymentState.apr).toBe(3.29);
        expect(result.paymentState.termMonths).toBe(60);
        expect(result.paymentState.expiresIn).toMatch(RE_EXPIRES_IN);
      }
    });
  });

  describe("S4 — Offer Expired", () => {
    it("maps expired payment state", () => {
      const result = toPurchaseCardFromApi(VDP_RESPONSE_EXPIRED_FIXTURE, "false");

      expect(result.paymentState).toEqual({ kind: "expired" });
    });
  });

  describe("dealer address fallback", () => {
    it("falls back to city/state/zip when extended is null", () => {
      const fixture = structuredClone(VDP_RESPONSE_DEFAULT_FIXTURE);
      const dealer = fixture.data.dealer;
      fixture.data.dealer = {
        dealerCode: dealer?.dealerCode ?? "",
        dealerName: dealer?.dealerName ?? "",
        city: dealer?.city ?? "",
        state: dealer?.state ?? "",
        zipCode: dealer?.zipCode ?? "",
        extended: null,
      };

      const result = toPurchaseCardFromApi(fixture, "false");

      expect(result.dealer.address).toContain("Brooklyn");
      expect(result.dealer.address).toContain("NY");
    });

    it("returns empty map thumbnail when no map image in extended", () => {
      const fixture = structuredClone(VDP_RESPONSE_DEFAULT_FIXTURE);
      if (fixture.data.dealer?.extended) {
        fixture.data.dealer.extended.images = [];
      }

      const result = toPurchaseCardFromApi(fixture, "false");

      expect(result.dealer.mapThumbnailUrl).toBe("");
    });
  });
});

describe("toSoldCardFromApi", () => {
  it("maps sold vehicle data for the sold card", () => {
    const result = toSoldCardFromApi(VDP_RESPONSE_SOLD_FIXTURE);

    expect(result.vehicle.make).toBe("Toyota");
    expect(result.vehicle.model).toBe("Highlander");
    expect(result.vehicle.trim).toBe("Hybrid Limited");
    expect(result.vehicle.year).toBe(2023);
    expect(result.vehicle.bodyStyle).toBe("SUV");
  });

  it("maps dealer name for the sold line", () => {
    const result = toSoldCardFromApi(VDP_RESPONSE_SOLD_FIXTURE);

    expect(result.dealer.name).toBe("Toyota of Bay Ridge");
  });

  it("maps soldAt date", () => {
    const result = toSoldCardFromApi(VDP_RESPONSE_SOLD_FIXTURE);

    expect(result.soldDate).toBe("2026-03-24T00:00:00.000Z");
  });
});

describe("toPurchaseCardFromApi — dealerInfo mapping", () => {
  it("maps dealer name from API response", () => {
    const result = toPurchaseCardFromApi(VDP_RESPONSE_DEFAULT_FIXTURE, "false");

    expect(result.dealerInfo.name).toBe("Toyota of Bay Ridge");
  });

  it("maps dealer address from extended data", () => {
    const result = toPurchaseCardFromApi(VDP_RESPONSE_DEFAULT_FIXTURE, "false");

    expect(result.dealerInfo.address.line1).toBe("6401 6th Ave");
    expect(result.dealerInfo.address.city).toBe("Brooklyn");
    expect(result.dealerInfo.address.state).toBe("NY");
    expect(result.dealerInfo.address.zip).toBe("11220");
  });

  it("maps dealer images array for the dialog", () => {
    const result = toPurchaseCardFromApi(VDP_RESPONSE_DEFAULT_FIXTURE, "false");

    const photos = result.dealerInfo.images.filter((img) => img.type === "photo");
    const maps = result.dealerInfo.images.filter((img) => img.type === "map");
    const thumbnails = result.dealerInfo.images.filter((img) => img.type === "map-thumbnail");

    expect(photos.length).toBeGreaterThanOrEqual(1);
    expect(maps.length).toBeGreaterThanOrEqual(1);
    expect(thumbnails.length).toBeGreaterThanOrEqual(1);
  });

  it("maps dealer hours from extended data", () => {
    const result = toPurchaseCardFromApi(VDP_RESPONSE_DEFAULT_FIXTURE, "false");

    expect(result.dealerInfo.hours.statusText).toBe("Open till 8 PM");
    expect(result.dealerInfo.hours.isOpenNow).toBe(true);
    expect(result.dealerInfo.hours.weekly.length).toBe(7);
  });

  it("maps dealer phone from extended data", () => {
    const result = toPurchaseCardFromApi(VDP_RESPONSE_DEFAULT_FIXTURE, "false");

    expect(result.dealerInfo.phone).toBe("(929) 538-3803");
  });

  it("maps dealer rating from extended data", () => {
    const result = toPurchaseCardFromApi(VDP_RESPONSE_DEFAULT_FIXTURE, "false");

    expect(result.dealerInfo.rating?.value).toBe(4.2);
    expect(result.dealerInfo.rating?.count).toBe(2140);
  });

  it("maps test drive data from extended data", () => {
    const result = toPurchaseCardFromApi(VDP_RESPONSE_DEFAULT_FIXTURE, "false");

    expect(result.dealerInfo.testDrive).not.toBeNull();
    expect(result.dealerInfo.testDrive?.dayLabel).toBe("Today");
    expect(result.dealerInfo.testDrive?.slots.length).toBe(5);
    expect(result.dealerInfo.testDrive?.slots).toContain("12:00 PM");
    expect(result.dealerInfo.testDrive?.slots).toContain("2:30 PM");
  });
});

describe("toPurchaseCardFromApi — image URL normalization", () => {
  it("normalizes same-origin map-thumbnail URL to relative path", () => {
    const result = toPurchaseCardFromApi(VDP_RESPONSE_DEFAULT_FIXTURE, "false");

    // Should be relative (no http://localhost:3000 prefix)
    expect(result.dealer.mapThumbnailUrl).not.toMatch(RE_HTTP_URL);
    expect(result.dealer.mapThumbnailUrl).toMatch(RE_IMAGES_PATH);
  });

  it("preserves external CDN URLs without stripping", () => {
    const fixture = structuredClone(VDP_RESPONSE_DEFAULT_FIXTURE);
    if (fixture.data.dealer?.extended) {
      fixture.data.dealer.extended.images = [
        {
          type: "map-thumbnail",
          url: "https://cdn.example.com/maps/bay-ridge.png",
          alt: "Map",
        },
      ];
    }

    const result = toPurchaseCardFromApi(fixture, "false");

    expect(result.dealer.mapThumbnailUrl).toBe("https://cdn.example.com/maps/bay-ridge.png");
  });
});
