// @vitest-environment node
import { validVehicleCard } from "@features/landing/__fixtures__/valid-vehicle-card";
import { vehicleCardSchema } from "@features/landing/data/schemas";

describe("vehicleCardSchema", () => {
  describe("happy path", () => {
    it("parses a fully valid vehicle card with trim present", () => {
      const result = vehicleCardSchema.safeParse(validVehicleCard);
      expect(result.success).toBe(true);
    });

    it("parses a valid vehicle card with trim omitted", () => {
      const { trim: _trim, ...withoutTrim } = validVehicleCard;
      const result = vehicleCardSchema.safeParse(withoutTrim);
      expect(result.success).toBe(true);
    });
  });

  describe("year constraints", () => {
    it("rejects year below 1900", () => {
      const result = vehicleCardSchema.safeParse({ ...validVehicleCard, year: 1899 });
      expect(result.success).toBe(false);
      if (!result.success) {
        const yearIssue = result.error.issues.find((i) => i.path[0] === "year");
        expect(yearIssue?.code).toBe("too_small");
      }
    });

    it("rejects year above 2100", () => {
      const result = vehicleCardSchema.safeParse({ ...validVehicleCard, year: 2101 });
      expect(result.success).toBe(false);
      if (!result.success) {
        const yearIssue = result.error.issues.find((i) => i.path[0] === "year");
        expect(yearIssue?.code).toBe("too_big");
      }
    });
  });

  describe("price constraints", () => {
    it("rejects price of -1", () => {
      const result = vehicleCardSchema.safeParse({ ...validVehicleCard, price: -1 });
      expect(result.success).toBe(false);
      if (!result.success) {
        const priceIssue = result.error.issues.find((i) => i.path[0] === "price");
        expect(priceIssue?.code).toBe("too_small");
      }
    });
  });

  describe("mileage constraints", () => {
    it("rejects mileage of -1", () => {
      const result = vehicleCardSchema.safeParse({ ...validVehicleCard, mileage: -1 });
      expect(result.success).toBe(false);
      if (!result.success) {
        const mileageIssue = result.error.issues.find((i) => i.path[0] === "mileage");
        expect(mileageIssue?.code).toBe("too_small");
      }
    });
  });

  describe("URL constraints", () => {
    it("rejects an invalid URL for imageUrl", () => {
      const result = vehicleCardSchema.safeParse({
        ...validVehicleCard,
        imageUrl: "not-a-valid-url",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const urlIssue = result.error.issues.find((i) => i.path[0] === "imageUrl");
        expect(urlIssue).toBeDefined();
      }
    });
  });
});
