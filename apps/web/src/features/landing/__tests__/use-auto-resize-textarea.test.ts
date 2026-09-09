import { act, renderHook } from "@ucmp/vitest-config/test-utils";
import { createRef, type RefObject } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { useAutoResizeTextarea } from "../hooks/use-auto-resize-textarea";

// ─── Constants (must match hook) ─────────────────────────

const SINGLE_LINE_HEIGHT = 44;
const MAX_HEIGHT = 300;
const MULTILINE_THRESHOLD = SINGLE_LINE_HEIGHT + 6; // 50

// ─── Helpers ────────────────────────────────────────────────

function createMockTextarea(scrollHeight = 44): HTMLTextAreaElement {
  const el = document.createElement("textarea");
  // jsdom doesn't calculate layout, so we mock scrollHeight via a getter
  Object.defineProperty(el, "scrollHeight", {
    configurable: true,
    get: () => scrollHeight,
  });
  document.body.appendChild(el);
  return el;
}

afterEach(() => {
  for (const el of document.body.querySelectorAll("textarea")) {
    el.remove();
  }
});

function renderAutoResize(ref: RefObject<HTMLTextAreaElement | null>, initialValue = "") {
  return renderHook(({ value }) => useAutoResizeTextarea(ref, value), {
    initialProps: { value: initialValue },
  });
}

// ─── Tests ──────────────────────────────────────────────────

describe("useAutoResizeTextarea", () => {
  it("returns isMultiline false for empty value and resets height", () => {
    const ref = createRef<HTMLTextAreaElement>() as RefObject<HTMLTextAreaElement | null>;
    const textarea = createMockTextarea(44);
    (ref as { current: HTMLTextAreaElement | null }).current = textarea;

    const { result } = renderAutoResize(ref, "");

    expect(result.current.isMultiline).toBe(false);
    expect(textarea.style.height).toBe("44px");
  });

  it("returns isMultiline false when scrollHeight is below threshold", () => {
    const ref = createRef<HTMLTextAreaElement>() as RefObject<HTMLTextAreaElement | null>;
    const textarea = createMockTextarea(MULTILINE_THRESHOLD - 1); // Just below threshold
    (ref as { current: HTMLTextAreaElement | null }).current = textarea;

    const { result } = renderAutoResize(ref, "short text");

    expect(result.current.isMultiline).toBe(false);
  });

  it("returns isMultiline true when scrollHeight exceeds threshold", () => {
    const ref = createRef<HTMLTextAreaElement>() as RefObject<HTMLTextAreaElement | null>;
    const textarea = createMockTextarea(MULTILINE_THRESHOLD + 1); // Just above threshold
    (ref as { current: HTMLTextAreaElement | null }).current = textarea;

    const { result } = renderAutoResize(ref, "a long query that wraps lines");

    expect(result.current.isMultiline).toBe(true);
  });

  it("collapses back when value changes from content to empty", () => {
    const ref = createRef<HTMLTextAreaElement>() as RefObject<HTMLTextAreaElement | null>;
    const textarea = createMockTextarea(MULTILINE_THRESHOLD + 30);
    (ref as { current: HTMLTextAreaElement | null }).current = textarea;

    const { result, rerender } = renderAutoResize(ref, "some text");

    expect(result.current.isMultiline).toBe(true);

    act(() => {
      rerender({ value: "" });
    });

    expect(result.current.isMultiline).toBe(false);
    expect(textarea.style.height).toBe(`${SINGLE_LINE_HEIGHT}px`);
  });

  it("caps height at MAX_HEIGHT and enables scroll when content exceeds max", () => {
    const ref = createRef<HTMLTextAreaElement>() as RefObject<HTMLTextAreaElement | null>;
    const textarea = createMockTextarea(450);
    (ref as { current: HTMLTextAreaElement | null }).current = textarea;

    renderAutoResize(ref, "very long content");

    expect(textarea.style.height).toBe(`${MAX_HEIGHT}px`);
    expect(textarea.style.overflowY).toBe("auto");
  });

  it("uses sticky multiline mode: stays multiline once wrapped until fully cleared", () => {
    const ref = createRef<HTMLTextAreaElement>() as RefObject<HTMLTextAreaElement | null>;
    const textarea = createMockTextarea(MULTILINE_THRESHOLD + 30); // Triggers wrap
    (ref as { current: HTMLTextAreaElement | null }).current = textarea;

    const { result, rerender } = renderAutoResize(ref, "initial wrapped text");

    expect(result.current.isMultiline).toBe(true);

    // Delete some characters but textarea is still physically wrapped
    act(() => {
      rerender({ value: "initial" });
    });

    // Should stay multiline (sticky) because it has wrapped before
    expect(result.current.isMultiline).toBe(true);

    // Clear completely to exit multiline mode
    act(() => {
      rerender({ value: "" });
    });

    expect(result.current.isMultiline).toBe(false);
    expect(textarea.style.height).toBe(`${SINGLE_LINE_HEIGHT}px`);
  });

  it("resets sticky mode only when transitioning to fully empty value", () => {
    const ref = createRef<HTMLTextAreaElement>() as RefObject<HTMLTextAreaElement | null>;
    const textarea = createMockTextarea(MULTILINE_THRESHOLD + 30);
    (ref as { current: HTMLTextAreaElement | null }).current = textarea;

    const { result, rerender } = renderAutoResize(ref, "wrapped text here");

    expect(result.current.isMultiline).toBe(true);

    // Reduce to whitespace (trim will make it empty)
    act(() => {
      rerender({ value: "   " });
    });

    expect(result.current.isMultiline).toBe(false);
    expect(textarea.style.height).toBe(`${SINGLE_LINE_HEIGHT}px`);
    expect(textarea.style.overflowY).toBe("hidden");

    // Add text again — should start fresh (no longer sticky)
    Object.defineProperty(textarea, "scrollHeight", {
      configurable: true,
      get: () => MULTILINE_THRESHOLD - 1,
    });

    act(() => {
      rerender({ value: "new text" });
    });

    expect(result.current.isMultiline).toBe(false);
  });

  it("does not exit multiline mode when deleting but content still wraps", () => {
    const ref = createRef<HTMLTextAreaElement>() as RefObject<HTMLTextAreaElement | null>;
    const textarea = createMockTextarea(MULTILINE_THRESHOLD + 30); // Initially wrapped
    (ref as { current: HTMLTextAreaElement | null }).current = textarea;

    const { result, rerender } = renderAutoResize(ref, "this is twenty characters text");

    expect(result.current.isMultiline).toBe(true);

    // Delete some content but scrollHeight still indicates wrap
    Object.defineProperty(textarea, "scrollHeight", {
      configurable: true,
      get: () => MULTILINE_THRESHOLD + 10,
    });

    act(() => {
      rerender({ value: "this is short" });
    });

    // Should stay multiline (sticky) because scrollHeight still wrapped
    expect(result.current.isMultiline).toBe(true);

    // Only clear fully to reset
    act(() => {
      rerender({ value: "" });
    });

    expect(result.current.isMultiline).toBe(false);
  });

  it("transitions from single-line to multiline on wrap detection", () => {
    const ref = createRef<HTMLTextAreaElement>() as RefObject<HTMLTextAreaElement | null>;
    const textarea = createMockTextarea(SINGLE_LINE_HEIGHT);
    (ref as { current: HTMLTextAreaElement | null }).current = textarea;

    const { result, rerender } = renderAutoResize(ref, "short");

    expect(result.current.isMultiline).toBe(false);

    Object.defineProperty(textarea, "scrollHeight", {
      configurable: true,
      get: () => MULTILINE_THRESHOLD + 10,
    });

    act(() => {
      rerender({ value: "now this text is longer and wraps to multiple lines" });
    });

    expect(result.current.isMultiline).toBe(true);
  });

  it("sets overflow hidden when content fits within height", () => {
    const ref = createRef<HTMLTextAreaElement>() as RefObject<HTMLTextAreaElement | null>;
    const textarea = createMockTextarea(MULTILINE_THRESHOLD + 10);
    (ref as { current: HTMLTextAreaElement | null }).current = textarea;

    renderAutoResize(ref, "wrapped content");

    expect(textarea.style.overflowY).toBe("hidden");
  });

  it("trims whitespace when determining if value is empty", () => {
    const ref = createRef<HTMLTextAreaElement>() as RefObject<HTMLTextAreaElement | null>;
    const textarea = createMockTextarea(MULTILINE_THRESHOLD + 30);
    (ref as { current: HTMLTextAreaElement | null }).current = textarea;

    const { result, rerender } = renderAutoResize(ref, "text");

    expect(result.current.isMultiline).toBe(true);

    // Value is whitespace only (trim will make it empty)
    act(() => {
      rerender({ value: "  \n\t  " });
    });

    expect(result.current.isMultiline).toBe(false);
    expect(textarea.style.height).toBe(`${SINGLE_LINE_HEIGHT}px`);
  });
});
