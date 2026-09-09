/// <reference types="@testing-library/jest-dom" />
import { act, render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { SaveSearchController } from "../components/save-search/save-search-controller";
import {
  SearchConversationalProvider,
  useSearchConversationalContext,
} from "../context/search-conversational-context";

// ─── Mock Toggle and icons to avoid UI package complexity ─────────────────────

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/search/test-session-123"),
}));

vi.mock("@ucmp/ui", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@ucmp/ui")>();
  return {
    ...actual,
    Toggle: ({
      children,
      pressed,
      onPressedChange,
    }: {
      children: React.ReactNode;
      pressed: boolean;
      onPressedChange: (v: boolean) => void;
    }) => (
      <button
        aria-pressed={pressed}
        data-testid="save-toggle"
        onClick={() => onPressedChange(!pressed)}
        type="button"
      >
        {children}
      </button>
    ),
  };
});

vi.mock("@ucmp/ui/icons", () => ({
  IconHeart: () => <svg data-testid="icon-heart" />,
  IconHeartFilled: () => <svg data-testid="icon-heart-filled" />,
}));

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderWrapper(sessionId = "test-session-123") {
  let contextRef: ReturnType<typeof useSearchConversationalContext> = null;

  function Probe() {
    contextRef = useSearchConversationalContext();
    return null;
  }

  render(
    <SearchConversationalProvider>
      <Probe />
      <SaveSearchController sessionId={sessionId} />
    </SearchConversationalProvider>
  );

  return { getCtx: () => contextRef };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("SaveSearchController", () => {
  it("renders the toggle in the DOM (invisible) on initial load", () => {
    renderWrapper();
    const wrapper = screen.getByTestId("save-toggle").parentElement;
    expect(wrapper?.className).toContain("invisible");
    expect(wrapper?.className).toContain("opacity-0");
  });

  it("remains hidden while in loading state", () => {
    const { getCtx } = renderWrapper();
    act(() => getCtx()?.setSearchConversationalState("loading"));
    // showSaveSearchToggle = false during loading
    const wrapper = screen.getByTestId("save-toggle").parentElement;
    expect(wrapper?.className).toContain("invisible");
    expect(wrapper?.className).toContain("opacity-0");
  });

  it("remains hidden after submitted state (no results yet)", () => {
    const { getCtx } = renderWrapper();
    act(() => getCtx()?.setSearchConversationalState("submitted"));
    const wrapper = screen.getByTestId("save-toggle").parentElement;
    expect(wrapper?.className).toContain("invisible");
  });

  it("becomes visible when results are ready (results-generated)", () => {
    const { getCtx } = renderWrapper();
    act(() => getCtx()?.setSearchConversationalState("loading"));
    // Still hidden while loading
    expect(screen.getByTestId("save-toggle").parentElement?.className).toContain("invisible");

    act(() => getCtx()?.setSearchConversationalState("results-generated"));
    // Now visible — showSaveSearchToggle = true
    expect(screen.getByTestId("save-toggle").parentElement?.className).not.toContain("invisible");
  });

  it("becomes visible in refinement state", () => {
    const { getCtx } = renderWrapper();
    act(() => getCtx()?.setSearchConversationalState("refinement"));
    expect(screen.getByTestId("save-toggle").parentElement?.className).not.toContain("invisible");
  });

  it("renders toggle with initial unsaved state", () => {
    renderWrapper();
    expect(screen.getByTestId("save-toggle")).toHaveAttribute("aria-pressed", "false");
  });

  it("toggles saved state on click", () => {
    const { getCtx } = renderWrapper();
    act(() => getCtx()?.setSearchConversationalState("results-generated"));

    const toggle = screen.getByTestId("save-toggle");
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    act(() => toggle.click());
    expect(toggle).toHaveAttribute("aria-pressed", "true");
    act(() => toggle.click());
    expect(toggle).toHaveAttribute("aria-pressed", "false");
  });

  it("falls back gracefully when rendered outside provider (defaults hidden)", () => {
    render(<SaveSearchController sessionId="test-session-123" />);
    const wrapper = screen.getByTestId("save-toggle").parentElement;
    expect(wrapper?.className).toContain("invisible");
  });
});
