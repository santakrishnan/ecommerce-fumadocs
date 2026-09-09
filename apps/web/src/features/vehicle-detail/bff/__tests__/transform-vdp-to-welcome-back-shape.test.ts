// @vitest-environment node
import { describe, expect, it } from "vitest";
import { VDP_RESPONSE_DEFAULT_FIXTURE } from "../__fixtures__/vdp-response.fixture";
import type { VdpApiResponse } from "../contracts/vdp-response.schema";
import { transformVdpToWelcomeBackShape } from "../use-cases/get-vehicle-detail";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Deep-clone the default fixture so each test can mutate without interference. */
function cloneDefault(): VdpApiResponse {
  return structuredClone(VDP_RESPONSE_DEFAULT_FIXTURE);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("transformVdpToWelcomeBackShape", () => {
  describe("error cases", () => {
    it("returns VEHICLE_NOT_FOUND error when data.vehicle is null", () => {
      const vdpData = cloneDefault();
      vdpData.data.vehicle = null;

      const result = transformVdpToWelcomeBackShape(vdpData);

      expect(result).toEqual({
        error: { code: "VEHICLE_NOT_FOUND", message: "Vehicle data unavailable" },
      });
    });
  });

  describe("vehicleInfo mapping", () => {
    it("maps core identity fields from vehicle.vehicleInfo", () => {
      const result = transformVdpToWelcomeBackShape(cloneDefault());

      expect("error" in result).toBe(false);
      if ("error" in result) {
        return;
      }

      expect(result.vehicleInfo.year).toBe(2023);
      expect(result.vehicleInfo.make).toBe("Toyota");
      expect(result.vehicleInfo.model).toBe("Highlander");
      expect(result.vehicleInfo.trim).toBe("Hybrid Limited");
    });

    it("maps drivetrain from vehicleInfo.drivetrain, not transmission", () => {
      const vdpData = cloneDefault();
      // biome-ignore lint/style/noNonNullAssertion: fixture is known to exist
      vdpData.data.vehicle!.vehicleInfo.drivetrain = "All Wheel Drive";
      // biome-ignore lint/style/noNonNullAssertion: fixture is known to exist
      vdpData.data.vehicle!.vehicleInfo.transmission = "ECVT";

      const result = transformVdpToWelcomeBackShape(vdpData);

      expect("error" in result).toBe(false);
      if ("error" in result) {
        return;
      }

      expect(result.vehicleInfo.drivetrain).toBe("All Wheel Drive");
    });

    it("passes through optional vehicleInfo fields when present", () => {
      const result = transformVdpToWelcomeBackShape(cloneDefault());

      expect("error" in result).toBe(false);
      if ("error" in result) {
        return;
      }

      expect(result.vehicleInfo.bodyStyle).toBe("SUV");
      expect(result.vehicleInfo.fuelType).toBe("Hybrid");
      expect(result.vehicleInfo.engine).toBe("2.5L I-4 Hybrid");
    });

    it("passes through undefined for optional vehicleInfo fields when absent", () => {
      const vdpData = cloneDefault();
      // biome-ignore lint/style/noNonNullAssertion: fixture is known to exist
      vdpData.data.vehicle!.vehicleInfo.bodyStyle = undefined;
      // biome-ignore lint/style/noNonNullAssertion: fixture is known to exist
      vdpData.data.vehicle!.vehicleInfo.drivetrain = undefined;
      // biome-ignore lint/style/noNonNullAssertion: fixture is known to exist
      vdpData.data.vehicle!.vehicleInfo.fuelType = undefined;
      // biome-ignore lint/style/noNonNullAssertion: fixture is known to exist
      vdpData.data.vehicle!.vehicleInfo.engine = undefined;

      const result = transformVdpToWelcomeBackShape(vdpData);

      expect("error" in result).toBe(false);
      if ("error" in result) {
        return;
      }

      expect(result.vehicleInfo.bodyStyle).toBeUndefined();
      expect(result.vehicleInfo.drivetrain).toBeUndefined();
      expect(result.vehicleInfo.fuelType).toBeUndefined();
      expect(result.vehicleInfo.engine).toBeUndefined();
    });
  });

  describe("dealerInfo mapping", () => {
    it("reads dealerCode and dealerName from vehicle.dealerInfo", () => {
      const result = transformVdpToWelcomeBackShape(cloneDefault());

      expect("error" in result).toBe(false);
      if ("error" in result) {
        return;
      }

      expect(result.dealerInfo.dealerCode).toBe("BR-001");
      expect(result.dealerInfo.dealerName).toBe("Toyota of Bay Ridge");
    });

    it("reads dealer location fields from vehicle.dealerInfo", () => {
      const result = transformVdpToWelcomeBackShape(cloneDefault());

      expect("error" in result).toBe(false);
      if ("error" in result) {
        return;
      }

      expect(result.dealerInfo.city).toBe("Brooklyn");
      expect(result.dealerInfo.state).toBe("NY");
      expect(result.dealerInfo.zipCode).toBe("11220");
    });

    it("still returns dealerCode and dealerName when data.dealer is null", () => {
      const vdpData = cloneDefault();
      vdpData.data.dealer = null;

      const result = transformVdpToWelcomeBackShape(vdpData);

      expect("error" in result).toBe(false);
      if ("error" in result) {
        return;
      }

      // Must never be empty — vehicleDealerInfoSchema enforces .min(1)
      expect(result.dealerInfo.dealerCode).toBe("BR-001");
      expect(result.dealerInfo.dealerName).toBe("Toyota of Bay Ridge");
    });

    it("defaults city/state/zipCode to empty string when absent on both data.dealer and vehicle.dealerInfo", () => {
      const vdpData = cloneDefault();
      vdpData.data.dealer = null;
      // biome-ignore lint/style/noNonNullAssertion: fixture is known to exist
      vdpData.data.vehicle!.dealerInfo.city = undefined;
      // biome-ignore lint/style/noNonNullAssertion: fixture is known to exist
      vdpData.data.vehicle!.dealerInfo.state = undefined;
      // biome-ignore lint/style/noNonNullAssertion: fixture is known to exist
      vdpData.data.vehicle!.dealerInfo.zipCode = undefined;

      const result = transformVdpToWelcomeBackShape(vdpData);

      expect("error" in result).toBe(false);
      if ("error" in result) {
        return;
      }

      expect(result.dealerInfo.city).toBe("");
      expect(result.dealerInfo.state).toBe("");
      expect(result.dealerInfo.zipCode).toBe("");
    });
  });

  describe("media mapping", () => {
    it("returns photos and videos arrays when media is present", () => {
      const result = transformVdpToWelcomeBackShape(cloneDefault());

      expect("error" in result).toBe(false);
      if ("error" in result) {
        return;
      }

      expect(Array.isArray(result.media.photos)).toBe(true);
      expect(Array.isArray(result.media.videos)).toBe(true);
      expect(result.media.photos.length).toBeGreaterThan(0);
    });

    it("returns empty arrays when vehicle.media is null", () => {
      const vdpData = cloneDefault();
      // biome-ignore lint/style/noNonNullAssertion: fixture is known to exist
      vdpData.data.vehicle!.media = null as never;

      const result = transformVdpToWelcomeBackShape(vdpData);

      expect("error" in result).toBe(false);
      if ("error" in result) {
        return;
      }

      expect(result.media).toEqual({ photos: [], videos: [] });
    });

    it("returns empty arrays when vehicle.media is undefined", () => {
      const vdpData = cloneDefault();
      // biome-ignore lint/style/noNonNullAssertion: fixture is known to exist
      vdpData.data.vehicle!.media = undefined;

      const result = transformVdpToWelcomeBackShape(vdpData);

      expect("error" in result).toBe(false);
      if ("error" in result) {
        return;
      }

      expect(result.media).toEqual({ photos: [], videos: [] });
    });

    it("defaults photos to empty array when media.photos is null", () => {
      const vdpData = cloneDefault();
      // biome-ignore lint/style/noNonNullAssertion: fixture is known to exist
      vdpData.data.vehicle!.media = { photos: null as never, videos: [] };

      const result = transformVdpToWelcomeBackShape(vdpData);

      expect("error" in result).toBe(false);
      if ("error" in result) {
        return;
      }

      expect(result.media.photos).toEqual([]);
    });

    it("maps each photo to exactly { url, displayOrder }, stripping other SDK fields", () => {
      const vdpData = cloneDefault();
      // biome-ignore lint/style/noNonNullAssertion: fixture is known to exist
      vdpData.data.vehicle!.media = {
        photos: [
          {
            url: "https://cdn.example.com/photo.jpg",
            displayOrder: 3,
            sourceId: "local",
            capturedAt: "2026-06-11T12:00:00.000Z",
            classification: "VehicleExterior",
          } as never,
        ],
        videos: [],
      };

      const result = transformVdpToWelcomeBackShape(vdpData);

      expect("error" in result).toBe(false);
      if ("error" in result) {
        return;
      }

      const [photo] = result.media.photos;
      expect(Object.keys(photo ?? {}).sort()).toEqual(["displayOrder", "url"]);
      expect(photo).toEqual({ url: "https://cdn.example.com/photo.jpg", displayOrder: 3 });
    });

    it("preserves an explicit photo displayOrder", () => {
      const vdpData = cloneDefault();
      // biome-ignore lint/style/noNonNullAssertion: fixture is known to exist
      vdpData.data.vehicle!.media = {
        photos: [
          { url: "https://cdn.example.com/a.jpg", displayOrder: 7 } as never,
          { url: "https://cdn.example.com/b.jpg", displayOrder: 4 } as never,
        ],
        videos: [],
      };

      const result = transformVdpToWelcomeBackShape(vdpData);

      expect("error" in result).toBe(false);
      if ("error" in result) {
        return;
      }

      expect(result.media.photos.map((p) => p.displayOrder)).toEqual([7, 4]);
    });

    it("falls back to 1-based array position when a photo displayOrder is null", () => {
      const vdpData = cloneDefault();
      // biome-ignore lint/style/noNonNullAssertion: fixture is known to exist
      vdpData.data.vehicle!.media = {
        photos: [
          { url: "https://cdn.example.com/a.jpg", displayOrder: null } as never,
          { url: "https://cdn.example.com/b.jpg", displayOrder: null } as never,
          { url: "https://cdn.example.com/c.jpg", displayOrder: null } as never,
        ],
        videos: [],
      };

      const result = transformVdpToWelcomeBackShape(vdpData);

      expect("error" in result).toBe(false);
      if ("error" in result) {
        return;
      }

      expect(result.media.photos.map((p) => p.displayOrder)).toEqual([1, 2, 3]);
    });

    it("falls back to 1-based array position when a photo omits displayOrder", () => {
      const vdpData = cloneDefault();
      // biome-ignore lint/style/noNonNullAssertion: fixture is known to exist
      vdpData.data.vehicle!.media = {
        photos: [
          { url: "https://cdn.example.com/a.jpg" } as never,
          { url: "https://cdn.example.com/b.jpg", displayOrder: 9 } as never,
          { url: "https://cdn.example.com/c.jpg" } as never,
        ],
        videos: [],
      };

      const result = transformVdpToWelcomeBackShape(vdpData);

      expect("error" in result).toBe(false);
      if ("error" in result) {
        return;
      }

      // Present value is kept; missing values fall back to index + 1.
      expect(result.media.photos.map((p) => p.displayOrder)).toEqual([1, 9, 3]);
    });

    it("maps each video to exactly { url, displayOrder }, applying the same displayOrder fallback", () => {
      const vdpData = cloneDefault();
      // biome-ignore lint/style/noNonNullAssertion: fixture is known to exist
      vdpData.data.vehicle!.media = {
        photos: [],
        videos: [
          { url: "https://cdn.example.com/v1.mp4", displayOrder: null } as never,
          { url: "https://cdn.example.com/v2.mp4", displayOrder: 5 } as never,
        ],
      };

      const result = transformVdpToWelcomeBackShape(vdpData);

      expect("error" in result).toBe(false);
      if ("error" in result) {
        return;
      }

      expect(result.media.videos).toEqual([
        { url: "https://cdn.example.com/v1.mp4", displayOrder: 1 },
        { url: "https://cdn.example.com/v2.mp4", displayOrder: 5 },
      ]);
    });

    it("defaults videos to empty array when media.videos is null", () => {
      const vdpData = cloneDefault();
      // biome-ignore lint/style/noNonNullAssertion: fixture is known to exist
      vdpData.data.vehicle!.media = { photos: [], videos: null as never };

      const result = transformVdpToWelcomeBackShape(vdpData);

      expect("error" in result).toBe(false);
      if ("error" in result) {
        return;
      }

      expect(result.media.videos).toEqual([]);
    });
  });

  describe("pricing and status mapping", () => {
    it("maps pricing fields directly", () => {
      const result = transformVdpToWelcomeBackShape(cloneDefault());

      expect("error" in result).toBe(false);
      if ("error" in result) {
        return;
      }

      expect(result.pricing.listPrice).toBe(31_775);
      expect(result.pricing.msrp).toBe(33_000);
      expect(result.pricing.sellingPrice).toBe(30_775);
    });

    it("maps status fields without adding isActive", () => {
      const result = transformVdpToWelcomeBackShape(cloneDefault());

      expect("error" in result).toBe(false);
      if ("error" in result) {
        return;
      }

      expect(result.status.vehicleStatus).toBe("In Stock");
      expect(result.status.mileage).toBe(36_435);
      expect("isActive" in result.status).toBe(false);
    });
  });

  describe("top-level fields", () => {
    it("maps vin from vehicle.vin", () => {
      const result = transformVdpToWelcomeBackShape(cloneDefault());

      expect("error" in result).toBe(false);
      if ("error" in result) {
        return;
      }

      // biome-ignore lint/style/noNonNullAssertion: fixture is known to exist
      expect(result.vin).toBe(VDP_RESPONSE_DEFAULT_FIXTURE.data.vehicle!.vin);
    });
  });
});
