import { act, renderHook } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import { useOtpFlow } from "../hooks/use-auth";

describe("useOtpFlow", () => {
  it("starts on the channel step with no identifier", () => {
    const { result } = renderHook(() => useOtpFlow());
    expect(result.current.step).toBe("start");
    expect(result.current.identifier).toBe("");
  });

  it("moves to the verify step and masks a phone channel to its last four digits", () => {
    const { result } = renderHook(() => useOtpFlow());
    act(() => result.current.submitChannel({ type: "phone", value: "555-123-4567" }));
    expect(result.current.step).toBe("verify");
    expect(result.current.identifier).toBe("(***) ***-4567");
  });

  it("masks an email channel to its first letter and domain", () => {
    const { result } = renderHook(() => useOtpFlow());
    act(() => result.current.submitChannel({ type: "email", value: "jason@toyota.com" }));
    expect(result.current.identifier).toBe("j***@toyota.com");
  });

  it("resets back to the start step and clears the identifier", () => {
    const { result } = renderHook(() => useOtpFlow());
    act(() => result.current.submitChannel({ type: "phone", value: "5551234567" }));
    act(() => result.current.reset());
    expect(result.current.step).toBe("start");
    expect(result.current.identifier).toBe("");
  });
});
