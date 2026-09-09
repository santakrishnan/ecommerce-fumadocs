// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
  buildCompareDescription,
  buildCompareTitle,
  DESCRIPTION_MAX,
  EMPTY_TITLE,
} from "../lib/compare-metadata";

const YEAR_RE = /\d{4}/;

describe("zero-vehicle metadata", () => {
  it("returns the generic title when there are no vehicles", () => {
    expect(buildCompareTitle([])).toBe(EMPTY_TITLE);
  });

  it("returns a bounded, non-naming description when there are no vehicles", () => {
    const description = buildCompareDescription([]);

    expect(description.length).toBeLessThanOrEqual(DESCRIPTION_MAX);
    // A generic sentence that names no specific vehicle (no year/model text).
    expect(description).not.toMatch(YEAR_RE);
    expect(description.toLowerCase()).toContain("compare vehicles");
  });
});
