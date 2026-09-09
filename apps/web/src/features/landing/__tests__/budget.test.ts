// @vitest-environment node
import { describe, expect, it } from "vitest";
import { computeTotalBudget } from "../lib/budget";

describe("computeTotalBudget", () => {
  it("returns down payment when monthly payment is 0", () => {
    expect(computeTotalBudget(5000, 0, 0.065, 60)).toBe(5000);
  });

  it("returns loan amount when down payment is 0", () => {
    const result = computeTotalBudget(0, 500, 0.065, 60);
    // PV = 500 * ((1 - (1 + 0.065/12)^-60) / (0.065/12))
    // Approximately $25,763
    expect(result).toBeGreaterThan(25_000);
    expect(result).toBeLessThan(26_000);
  });

  it("combines down payment and loan amount correctly", () => {
    const withoutDown = computeTotalBudget(0, 500, 0.065, 60);
    const withDown = computeTotalBudget(3000, 500, 0.065, 60);
    expect(withDown).toBe(withoutDown + 3000);
  });

  it("returns a rounded integer", () => {
    const result = computeTotalBudget(1000, 300, 0.065, 60);
    expect(result).toBe(Math.round(result));
  });

  it("higher APR produces lower total budget", () => {
    const lowApr = computeTotalBudget(0, 500, 0.04, 60);
    const highApr = computeTotalBudget(0, 500, 0.1, 60);
    expect(lowApr).toBeGreaterThan(highApr);
  });

  it("longer term produces higher total budget", () => {
    const shortTerm = computeTotalBudget(0, 500, 0.065, 36);
    const longTerm = computeTotalBudget(0, 500, 0.065, 72);
    expect(longTerm).toBeGreaterThan(shortTerm);
  });
});
