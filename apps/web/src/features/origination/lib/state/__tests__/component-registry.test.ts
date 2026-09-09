import { describe, expect, test } from "vitest";
import { componentRegistry, fromContext, isContextRef } from "../component-registry";

/**
 * The component registry is mostly convention and requires developers
 * to follow the basic rules established in order for all the typing
 * of the state machine blocks to work and pick up props.
 *
 * These test focus on ensuring that contract is fulfilled.
 */

test("every registry entry is shaped like { component }", () => {
  for (const [componentId, entry] of Object.entries(componentRegistry)) {
    expect(entry, `${componentId} is missing its component`).toHaveProperty("component");
  }
});

describe("fromContext", () => {
  test("returns a ContextRef keyed to the given field", () => {
    expect(fromContext<{ sampleText: string }, "sampleText">("sampleText")).toEqual({
      $context: "sampleText",
    });
  });
});

describe("isContextRef", () => {
  test("returns true for a fromContext result", () => {
    expect(isContextRef(fromContext<{ sampleText: string }, "sampleText">("sampleText"))).toBe(
      true
    );
  });

  test("returns false for a literal value, even one that looks like an object", () => {
    expect(isContextRef("sampleText")).toBe(false);
    expect(isContextRef({ text: "sampleText" })).toBe(false);
  });

  test("returns false for null", () => {
    expect(isContextRef(null)).toBe(false);
  });
});
