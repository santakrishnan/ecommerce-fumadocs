// @vitest-environment node
import { dealerOfferSchema } from "@features/landing/data/schemas";

const validDealerOffer = {
  id: "dealer-001",
  name: "Sunrise Auto Group",
  offerHeadline: "0% APR for 60 months on select models",
  imageSrc: "https://example.com/dealer.jpg",
  imageAlt: "Sunrise Auto Group showroom",
};

describe("dealerOfferSchema", () => {
  describe("happy path", () => {
    it("parses a fully valid DealerOfferData object", () => {
      const result = dealerOfferSchema.safeParse(validDealerOffer);
      expect(result.success).toBe(true);
    });

    it("parses an id of exactly 100 characters", () => {
      const result = dealerOfferSchema.safeParse({
        ...validDealerOffer,
        id: "a".repeat(100),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("required field validation", () => {
    it("rejects when id is missing", () => {
      const { id: _id, ...withoutId } = validDealerOffer;
      const result = dealerOfferSchema.safeParse(withoutId);
      expect(result.success).toBe(false);
    });

    it("rejects when name is missing", () => {
      const { name: _name, ...withoutName } = validDealerOffer;
      const result = dealerOfferSchema.safeParse(withoutName);
      expect(result.success).toBe(false);
    });

    it("rejects when offerHeadline is missing", () => {
      const { offerHeadline: _offerHeadline, ...withoutOfferHeadline } = validDealerOffer;
      const result = dealerOfferSchema.safeParse(withoutOfferHeadline);
      expect(result.success).toBe(false);
    });

    it("rejects when imageSrc is missing", () => {
      const { imageSrc: _imageSrc, ...withoutImageSrc } = validDealerOffer;
      const result = dealerOfferSchema.safeParse(withoutImageSrc);
      expect(result.success).toBe(false);
    });
  });

  describe("id constraints", () => {
    it("rejects an id of 101 characters", () => {
      const result = dealerOfferSchema.safeParse({
        ...validDealerOffer,
        id: "a".repeat(101),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("imageSrc constraints", () => {
    it("rejects a non-URL string for imageSrc", () => {
      const result = dealerOfferSchema.safeParse({
        ...validDealerOffer,
        imageSrc: "not-a-url",
      });
      expect(result.success).toBe(false);
    });
  });
});
