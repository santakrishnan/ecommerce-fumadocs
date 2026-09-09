// @vitest-environment node
import { describe, expect, it } from "vitest";
import { buildPreferenceRemovalNotificationText } from "../data/mock-search-preferences-refinement";

describe("buildPreferenceRemovalNotificationText", () => {
  it("returns empty string for no removals", () => {
    expect(buildPreferenceRemovalNotificationText([])).toBe("");
  });

  it("returns singular form for one removal", () => {
    expect(buildPreferenceRemovalNotificationText(["Blue"])).toBe(
      "You removed Blue from your preferences."
    );
  });

  it("returns 'and' without comma for two removals", () => {
    expect(buildPreferenceRemovalNotificationText(["Blue", "SUV"])).toBe(
      "You removed Blue and SUV from your preferences."
    );
  });

  it("returns comma-separated list with 'and' for three removals", () => {
    expect(buildPreferenceRemovalNotificationText(["Blue", "SUV", "Under $35k"])).toBe(
      "You removed Blue, SUV, and Under $35k from your preferences."
    );
  });
});
