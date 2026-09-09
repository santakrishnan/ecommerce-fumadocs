// @vitest-environment node
import { isValidCssColor, isValidHexColor } from "utils";
import { describe, expect, it } from "vitest";
import { mapVehicleInfoToColorData } from "../vehicle-info-to-color-data.mapper";

describe("isValidHexColor", () => {
  it("accepts 6-digit hex with #", () => {
    expect(isValidHexColor("#CE1E2D")).toBe(true);
    expect(isValidHexColor("#000000")).toBe(true);
  });

  it("accepts 3-digit hex with #", () => {
    expect(isValidHexColor("#fff")).toBe(true);
  });

  it("accepts 8-digit hex with # (alpha)", () => {
    expect(isValidHexColor("#CE1E2DFF")).toBe(true);
  });

  it("accepts bare hex without #", () => {
    expect(isValidHexColor("CE1E2D")).toBe(true);
    expect(isValidHexColor("5c3317")).toBe(true);
  });

  it("rejects CSS color names", () => {
    expect(isValidHexColor("red")).toBe(false);
    expect(isValidHexColor("gray")).toBe(false);
  });

  it("rejects multi-word strings", () => {
    expect(isValidHexColor("Cutting Edge")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidHexColor("")).toBe(false);
  });
});

describe("isValidCssColor", () => {
  it("accepts hex colors", () => {
    expect(isValidCssColor("#CE1E2D")).toBe(true);
    expect(isValidCssColor("5c3317")).toBe(true);
  });

  it("accepts single-word CSS named colors", () => {
    expect(isValidCssColor("red")).toBe(true);
    expect(isValidCssColor("gray")).toBe(true);
    expect(isValidCssColor("Black")).toBe(true);
  });

  it("rejects multi-word color names from API", () => {
    expect(isValidCssColor("Cutting Edge")).toBe(false);
    expect(isValidCssColor("Wind Chill Pearl")).toBe(false);
    expect(isValidCssColor("Ruby Red Flare Pearl")).toBe(false);
  });

  it("rejects empty and whitespace", () => {
    expect(isValidCssColor("")).toBe(false);
    expect(isValidCssColor("   ")).toBe(false);
  });
});

describe("mapVehicleInfoToColorData", () => {
  it("returns undefined when vehicleInfo is undefined", () => {
    expect(mapVehicleInfoToColorData(undefined)).toBeUndefined();
  });

  it("passes through valid hex colors with normalization", () => {
    const result = mapVehicleInfoToColorData({
      exteriorColor: "CE1E2D",
      exteriorColorFamily: "Ruby Red",
      interiorColor: "#5c3317",
      interiorColorFamily: "Brown",
      interiorMaterial: "Leather",
      interiorTextureImage: "/images/texture.png",
    } as never);

    expect(result?.exteriorColor).toBe("#CE1E2D");
    expect(result?.interiorColor).toBe("#5c3317");
  });

  it("accepts single-word CSS color names", () => {
    const result = mapVehicleInfoToColorData({
      exteriorColor: "gray",
      exteriorColorFamily: "Gray",
      interiorColor: "black",
      interiorColorFamily: "Black",
      interiorMaterial: "Fabric",
    } as never);

    expect(result?.exteriorColor).toBe("gray");
    expect(result?.interiorColor).toBe("black");
  });

  it("sets color to undefined for invalid multi-word names", () => {
    const result = mapVehicleInfoToColorData({
      exteriorColor: "Cutting Edge",
      exteriorColorFamily: "Other",
      interiorColor: "Glazed Caramel",
      interiorColorFamily: "Brown",
      interiorMaterial: "Leather",
    } as never);

    expect(result?.exteriorColor).toBeUndefined();
    expect(result?.interiorColor).toBeUndefined();
    // Labels still come through
    expect(result?.exteriorColorFamily).toBe("Other");
    expect(result?.interiorColorFamily).toBe("Brown");
  });

  it("falls back to 'Color not available' for missing family names", () => {
    const result = mapVehicleInfoToColorData({
      exteriorColor: "#CE1E2D",
      interiorColor: "#000",
      interiorMaterial: "Cloth",
    } as never);

    expect(result?.exteriorColorFamily).toBe("Color not available");
    expect(result?.interiorColorFamily).toBe("Color not available");
  });

  it("passes through interiorTextureImage", () => {
    const result = mapVehicleInfoToColorData({
      exteriorColor: "#fff",
      exteriorColorFamily: "White",
      interiorColor: "#000",
      interiorColorFamily: "Black",
      interiorMaterial: "Leather",
      interiorTextureImage: "/images/vdp/Ellipse.png",
    } as never);

    expect(result?.interiorTextureImage).toBe("/images/vdp/Ellipse.png");
  });
});
