// @vitest-environment node
import { describe, expect, it } from "vitest";
import { buildSimilarSearchHref } from "../build-similar-search-href";

const SEARCH_PATH_REGEX = /^\/search\?/;

describe("buildSimilarSearchHref", () => {
  const baseVehicle = {
    make: "Toyota",
    model: "Highlander Hybrid",
    trim: "Limited",
    year: 2023,
    bodyStyle: "SUV",
  };

  it("returns a path starting with /search", () => {
    const href = buildSimilarSearchHref(baseVehicle);
    expect(href).toMatch(SEARCH_PATH_REGEX);
  });

  it("includes make and model as query params", () => {
    const href = buildSimilarSearchHref(baseVehicle);
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("make")).toBe("Toyota");
    expect(params.get("model")).toBe("Highlander Hybrid");
  });

  it("includes trim when provided", () => {
    const href = buildSimilarSearchHref(baseVehicle);
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("trim")).toBe("Limited");
  });

  it("omits trim when not provided", () => {
    const { trim: _, ...noTrim } = baseVehicle;
    const href = buildSimilarSearchHref({ ...noTrim, trim: "" });
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.has("trim")).toBe(false);
  });

  it("includes bodyStyle when provided", () => {
    const href = buildSimilarSearchHref(baseVehicle);
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("bodyStyle")).toBe("SUV");
  });

  it("omits bodyStyle when not provided", () => {
    const { bodyStyle: _, ...noBodyStyle } = baseVehicle;
    const href = buildSimilarSearchHref(noBodyStyle);
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.has("bodyStyle")).toBe(false);
  });

  it("sets yearMin to vehicle.year - 2", () => {
    const href = buildSimilarSearchHref(baseVehicle);
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("yearMin")).toBe("2021");
  });

  it("sets yearMax to vehicle.year + 2", () => {
    const href = buildSimilarSearchHref(baseVehicle);
    const params = new URLSearchParams(href.split("?")[1]);
    expect(params.get("yearMax")).toBe("2025");
  });

  it("encodes special characters in query params", () => {
    const vehicle = { ...baseVehicle, model: "RAV4 Prime+" };
    const href = buildSimilarSearchHref(vehicle);
    // URLSearchParams encodes properly
    expect(href).toContain("model=RAV4+Prime%2B");
  });
});
