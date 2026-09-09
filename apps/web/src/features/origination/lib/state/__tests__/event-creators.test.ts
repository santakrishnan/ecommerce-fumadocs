import { describe, expect, test } from "vitest";
import { go, loadComplete, setSubmitError, setValidationError } from "../event-creators";

describe("setValidationError", () => {
  test("groups standard schema issues by field", () => {
    const result = setValidationError([
      { message: "Required", path: ["firstName"] },
      { message: "Too short", path: ["lastName"] },
    ]);

    expect(result.error.fieldErrors).toEqual({
      firstName: ["Required"],
      lastName: ["Too short"],
    });
  });

  test("accumulates multiple issues on the same field", () => {
    const result = setValidationError([
      { message: "Required", path: ["email"] },
      { message: "Must be a valid email", path: ["email"] },
    ]);

    expect(result.error.fieldErrors.email).toEqual(["Required", "Must be a valid email"]);
  });

  test("collapses a nested path to its first segment's key", () => {
    const result = setValidationError([
      { message: "Invalid city", path: [{ key: "address" }, "city"] },
    ]);

    expect(result.error.fieldErrors).toEqual({ address: ["Invalid city"] });
  });

  test("falls back to _form when an issue has no path", () => {
    const result = setValidationError([{ message: "Form is invalid", path: undefined }]);

    expect(result.error.fieldErrors).toEqual({ _form: ["Form is invalid"] });
  });

  test("returns a properly formatted xstate event", () => {
    const result = setValidationError([{ message: "Required", path: ["firstName"] }]);

    expect(result).toEqual({
      type: "SUBMIT_ERROR",
      error: { type: "validation", fieldErrors: { firstName: ["Required"] } },
    });
  });
});

describe("go", () => {
  test("returns a properly formatted xstate event", () => {
    expect(go("sample-2", { visitedSample: true })).toEqual({
      type: "GO_sample-2",
      output: { visitedSample: true },
    });
  });

  test("output defaults to undefined when omitted", () => {
    expect(go("sample-2")).toEqual({ type: "GO_sample-2", output: undefined });
  });
});

describe("setSubmitError", () => {
  test("wraps the error for the UI to distinguish the source", () => {
    const cause = new Error("boom");
    const result = setSubmitError(cause);

    expect(result.error).toEqual({ type: "submit", error: cause });
  });

  test("returns a properly formatted xstate event", () => {
    const result = setSubmitError("boom");

    expect(result).toEqual({ type: "SUBMIT_ERROR", error: { type: "submit", error: "boom" } });
  });
});

describe("loadComplete", () => {
  test("returns a properly formatted xstate event", () => {
    const result = loadComplete({ sampleText: "hello" });

    expect(result).toEqual({ type: "LOAD_COMPLETE", data: { sampleText: "hello" } });
  });
});
