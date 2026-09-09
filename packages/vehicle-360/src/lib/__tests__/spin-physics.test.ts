import { describe, expect, it } from "vitest";
import { spinPositionToFrameIndex, wrapSpinPosition } from "../spin-physics";

describe("wrapSpinPosition", () => {
  it("returns 0 when frameCount is 0", () => {
    expect(wrapSpinPosition(5, 0)).toBe(0);
  });

  it("returns the value unchanged when it is within [0, frameCount)", () => {
    expect(wrapSpinPosition(5, 36)).toBe(5);
    expect(wrapSpinPosition(0, 36)).toBe(0);
  });

  it("wraps forward when value equals frameCount", () => {
    expect(wrapSpinPosition(36, 36)).toBe(0);
  });

  it("wraps forward when value exceeds frameCount", () => {
    expect(wrapSpinPosition(37, 36)).toBe(1);
    expect(wrapSpinPosition(72, 36)).toBe(0);
  });

  it("wraps negative values to positive equivalents", () => {
    expect(wrapSpinPosition(-1, 36)).toBe(35);
    expect(wrapSpinPosition(-36, 36)).toBe(-0); // (-36 % 36) === -0 in JS; functionally equal to 0
    expect(wrapSpinPosition(-37, 36)).toBe(35);
  });
});

describe("spinPositionToFrameIndex", () => {
  it("returns 0 when frameCount is 0", () => {
    expect(spinPositionToFrameIndex(5, 0)).toBe(0);
  });

  it("returns 0 for position 0", () => {
    expect(spinPositionToFrameIndex(0, 36)).toBe(0);
  });

  it("rounds down for positions below .5", () => {
    expect(spinPositionToFrameIndex(2.4, 36)).toBe(2);
  });

  it("rounds up for positions at .5 and above", () => {
    expect(spinPositionToFrameIndex(2.5, 36)).toBe(3);
    expect(spinPositionToFrameIndex(2.6, 36)).toBe(3);
  });

  it("wraps around when rounded position equals frameCount", () => {
    expect(spinPositionToFrameIndex(36, 36)).toBe(0);
  });

  it("handles negative positions by wrapping to positive frame indices", () => {
    expect(spinPositionToFrameIndex(-1, 36)).toBe(35);
    expect(spinPositionToFrameIndex(-0.4, 36)).toBe(0); // rounds to 0
  });
});
