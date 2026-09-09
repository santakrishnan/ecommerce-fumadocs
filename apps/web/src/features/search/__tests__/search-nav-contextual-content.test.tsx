/// <reference types="@testing-library/jest-dom" />
import { act, render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import { SearchNavContextualContent } from "../components/search-nav-contextual-content";
import {
  SearchConversationalProvider,
  useSearchConversationalContext,
} from "../context/search-conversational-context";

// ─── Shared pill fixture ──────────────────────────────────────────────────────

// In production this node comes from the server layout (LocationPillWrapper).
// In tests we pass a plain div — the component treats it as opaque ReactNode.
const LOCATION_PILL_NODE = <div data-testid="location-pill">11001</div>;

// ─── Helper ───────────────────────────────────────────────────────────────────

function renderSlot() {
  let contextRef: ReturnType<typeof useSearchConversationalContext> = null;

  function Probe() {
    contextRef = useSearchConversationalContext();
    return null;
  }

  render(
    <SearchConversationalProvider>
      <Probe />
      <SearchNavContextualContent locationPill={LOCATION_PILL_NODE} />
    </SearchConversationalProvider>
  );

  return { getCtx: () => contextRef };
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("SearchNavContextualContent", () => {
  it("renders locationPill on initial load (showLocationPill = true)", () => {
    renderSlot();
    expect(screen.getByTestId("location-pill")).toBeInTheDocument();
  });

  it("hides locationPill after a prompt is submitted (loading state)", () => {
    const { getCtx } = renderSlot();
    act(() => getCtx()?.setSearchConversationalState("loading"));
    expect(screen.getByTestId("location-pill").parentElement).toHaveClass("opacity-0");
  });

  it("keeps locationPill hidden while data is loading", () => {
    const { getCtx } = renderSlot();
    act(() => getCtx()?.setSearchConversationalState("loading"));
    expect(getCtx()?.isLoading).toBe(true);
    expect(getCtx()?.showLocationPill).toBe(false);
    expect(screen.getByTestId("location-pill").parentElement).toHaveClass("opacity-0");
  });

  it("keeps locationPill hidden after loading completes (submitted state)", () => {
    const { getCtx } = renderSlot();
    act(() => getCtx()?.setSearchConversationalState("loading"));
    act(() => getCtx()?.setSearchConversationalState("submitted"));
    expect(getCtx()?.isLoading).toBe(false);
    expect(getCtx()?.showLocationPill).toBe(false);
    expect(screen.getByTestId("location-pill").parentElement).toHaveClass("opacity-0");
  });

  it("renders locationPill when used outside provider (defaults showLocationPill = true)", () => {
    render(<SearchNavContextualContent locationPill={LOCATION_PILL_NODE} />);
    expect(screen.getByTestId("location-pill")).toBeInTheDocument();
  });

  it("locationPill and SaveSearchToggle are never simultaneously visible", () => {
    const { getCtx } = renderSlot();

    // Initial: location pill visible, save toggle hidden
    expect(getCtx()?.showLocationPill).toBe(true);
    expect(getCtx()?.showSaveSearchToggle).toBe(false);

    // During loading: both hidden
    act(() => getCtx()?.setSearchConversationalState("loading"));
    expect(getCtx()?.showLocationPill).toBe(false);
    expect(getCtx()?.showSaveSearchToggle).toBe(false);

    // Results ready: save toggle visible, location pill still hidden
    act(() => getCtx()?.setSearchConversationalState("results-generated"));
    expect(getCtx()?.showLocationPill).toBe(false);
    expect(getCtx()?.showSaveSearchToggle).toBe(true);
  });
});
