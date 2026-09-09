import { describe, expect, it } from "vitest";
import {
  getVehicleImageEntry,
  listVehicleImageEntries,
  resolveVehicleImage,
} from "../vehicle-images";

const COROLLACROSS_XLE_RE =
  /^\/vehicles\/toyota\/corollacross\/2026\/xle\/toyota-corollacross-2026-xle-.+-angle-13\.webp$/;
const CAMRY_RE = /^\/vehicles\/toyota\/camry\/2026\/.+\.webp$/;
const HIGHLANDER_RE = /^\/vehicles\/toyota\/highlander\/2026\/.+\.webp$/;
const RAV4_RE = /^\/vehicles\/toyota\/rav4\/2026\/.+\.webp$/;
const COROLLA_RE = /^\/vehicles\/toyota\/corolla\/2026\/.+\.webp$/;
const VEHICLE_IMAGE_RE = /^\/vehicles\/toyota\/.+\.webp$/;

describe("resolveVehicleImage", () => {
  it("resolves an exact make/model/year/trim to the grade default image", () => {
    const image = resolveVehicleImage({
      make: "Toyota",
      model: "Corolla Cross",
      year: 2026,
      trim: "XLE",
    });
    expect(image).toMatch(COROLLACROSS_XLE_RE);
  });

  it("resolves a specific color to that color's image", () => {
    const entry = getVehicleImageEntry("Toyota", "RAV4", 2026);
    const grade = entry?.grades.find((g) => g.gradeName === "LE");
    const target = grade?.colors.find((c) => c.code !== grade.defaultColorCode);
    expect(target).toBeDefined();

    const image = resolveVehicleImage({
      make: "Toyota",
      model: "RAV4",
      year: 2026,
      trim: "LE",
      color: target?.code,
    });
    expect(image).toBe(target?.image);
  });

  it("matches a color by title", () => {
    const entry = getVehicleImageEntry("Toyota", "RAV4", 2026);
    const grade = entry?.grades[0];
    const target = grade?.colors[0];
    const image = resolveVehicleImage({
      make: "Toyota",
      model: "RAV4",
      year: 2026,
      trim: grade?.gradeName,
      color: target?.title,
    });
    expect(image).toBe(target?.image);
  });

  it("falls back to the grade default image when the color does not match", () => {
    const entry = getVehicleImageEntry("Toyota", "RAV4", 2026);
    const grade = entry?.grades.find((g) => g.gradeName === "LE");
    const image = resolveVehicleImage({
      make: "Toyota",
      model: "RAV4",
      year: 2026,
      trim: "LE",
      color: "NotARealColor",
    });
    expect(image).toBe(grade?.image);
  });

  it("falls back to the first grade when the trim does not match", () => {
    const image = resolveVehicleImage({
      make: "Toyota",
      model: "Camry",
      year: 2026,
      trim: "Nonexistent Trim",
    });
    expect(image).toMatch(CAMRY_RE);
  });

  it("matches a trim by partial name", () => {
    const image = resolveVehicleImage({
      make: "Toyota",
      model: "Highlander",
      year: 2026,
      trim: "Hybrid XLE",
    });
    expect(image).toMatch(HIGHLANDER_RE);
  });

  it("resolves reused static images for non-Toyota makes", () => {
    const image = resolveVehicleImage({
      make: "Ford",
      model: "Explorer Hybrid",
      year: 2024,
    });
    expect(image).toBe("/images/search/ford-explorer-hybrid-2024.png");
  });

  it("maps a '<model> Hybrid' name to the base series", () => {
    const image = resolveVehicleImage({ make: "Toyota", model: "RAV4 Hybrid", year: 2026 });
    expect(image).toMatch(RAV4_RE);
  });

  it("maps a 'Corolla Hybrid' name to the base Corolla series", () => {
    const image = resolveVehicleImage({ make: "Toyota", model: "Corolla Hybrid", year: 2026 });
    expect(image).toMatch(COROLLA_RE);
  });

  it("returns a model-appropriate fallback for an unknown model", () => {
    const image = resolveVehicleImage({ make: "Toyota", model: "DeLorean" });
    // Unknown model falls through to body-type representative (Camry for sedan-like)
    expect(image).toMatch(VEHICLE_IMAGE_RE);
  });

  it("returns a valid fallback when make or model is missing", () => {
    const withMakeOnly = resolveVehicleImage({ make: "Toyota" });
    expect(withMakeOnly).toMatch(VEHICLE_IMAGE_RE);
    const withNothing = resolveVehicleImage({});
    expect(withNothing).toMatch(VEHICLE_IMAGE_RE);
  });

  it("ignores the year when no matching year exists", () => {
    const image = resolveVehicleImage({
      make: "Toyota",
      model: "RAV4",
      year: 1998,
      trim: "LE",
    });
    expect(image).toMatch(RAV4_RE);
  });
});

describe("getVehicleImageEntry", () => {
  it("returns the entry with grades and per-grade colors", () => {
    const entry = getVehicleImageEntry("Toyota", "Corolla Cross", 2026);
    expect(entry).toBeDefined();
    expect(entry?.grades.length).toBeGreaterThan(0);
    const grade = entry?.grades[0];
    expect(grade?.colors.length).toBeGreaterThan(0);
    expect(grade?.colors[0]).toHaveProperty("hex");
    expect(grade?.colors[0]).toHaveProperty("image");
    expect(grade).toHaveProperty("defaultColorCode");
  });
});

describe("listVehicleImageEntries", () => {
  it("includes both Toyota and reused non-Toyota entries", () => {
    const all = listVehicleImageEntries();
    expect(all.some((entry) => entry.make === "Toyota")).toBe(true);
    expect(all.some((entry) => entry.make === "Ford")).toBe(true);
  });
});
