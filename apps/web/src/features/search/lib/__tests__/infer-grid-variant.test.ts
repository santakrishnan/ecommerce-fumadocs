// @vitest-environment node
import { describe, expect, it } from "vitest";
import { inferGridVariant } from "../infer-grid-variant";

describe("inferGridVariant", () => {
  it("returns 14-cards-small for inventory with 6–14 cards", () => {
    expect(inferGridVariant("inventory", 6)).toBe("14-cards-small");
    expect(inferGridVariant("inventory", 8)).toBe("14-cards-small");
    expect(inferGridVariant("inventory", 10)).toBe("14-cards-small");
    expect(inferGridVariant("inventory", 14)).toBe("14-cards-small");
  });

  it("returns null for inventory counts outside 6–14", () => {
    expect(inferGridVariant("inventory", 0)).toBeNull();
    expect(inferGridVariant("inventory", 1)).toBeNull();
    expect(inferGridVariant("inventory", 4)).toBeNull();
    expect(inferGridVariant("inventory", 5)).toBeNull();
    expect(inferGridVariant("inventory", 15)).toBeNull();
  });

  it("returns null for non-inventory card types regardless of count", () => {
    expect(inferGridVariant("model", 8)).toBeNull();
    expect(inferGridVariant("editorial", 6)).toBeNull();
    expect(inferGridVariant("comparison", 20)).toBeNull();
    expect(inferGridVariant("trim", 0)).toBeNull();
  });

  it("uses explicit variant override when provided", () => {
    expect(inferGridVariant("inventory", 5, "6-cards-mix")).toBe("6-cards-mix");
    expect(inferGridVariant("model", 8, "6-cards-small")).toBe(null);
  });
});
