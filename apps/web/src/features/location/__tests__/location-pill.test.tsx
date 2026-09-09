import { LOCATION_QUERY_KEY } from "@features/location";
import { QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  createTestQueryClient,
  render,
  screen,
  userEvent,
} from "@ucmp/vitest-config/test-utils";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  locationPillCustom,
  locationPillDefault,
  locationPillEmpty,
  locationPillEmptyString,
} from "../__fixtures__/location-pill";
import { LocationPill } from "../components/location-pill";
import { LocationPillSkeleton } from "../components/location-pill-skeleton";
import type { ZipCodePopoverContentProps } from "../components/zip-code-popover";

// Isolate LocationPill from ZipCodeDialogContent internals.
// Renders a simple marker so we can assert popover content rendering.
vi.mock("../components/zip-code-popover", () => ({
  ZipCodePopoverContent: (_props: ZipCodePopoverContentProps) => (
    <div data-testid="mock-zip-popover" />
  ),
}));

// ─── Regex constants ─────────────────────────────────────────────────
const CHANGE_LOCATION_PATTERN = /change location/i;
const SKELETON_TEST_ID = "location-pill-skeleton";

/** Renders inside a fresh QueryClientProvider and exposes the client for cache writes. */
function renderWithClient(ui: ReactElement) {
  const queryClient = createTestQueryClient();
  const view = render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
  return { queryClient, ...view };
}

describe("LocationPill", () => {
  it("renders a button with 'Change location' aria-label", () => {
    renderWithClient(<LocationPill {...locationPillDefault} />);
    expect(screen.getByRole("button", { name: CHANGE_LOCATION_PATTERN })).toBeInTheDocument();
  });

  it("displays the server-resolved zip when provided", () => {
    renderWithClient(<LocationPill {...locationPillDefault} />);
    expect(screen.getByRole("button", { name: CHANGE_LOCATION_PATTERN })).toHaveTextContent(
      "10001"
    );
  });

  it("displays a custom location when provided", () => {
    renderWithClient(<LocationPill {...locationPillCustom} />);
    expect(screen.getByRole("button", { name: CHANGE_LOCATION_PATTERN })).toHaveTextContent(
      "90210"
    );
  });

  // ─── Skeleton state (first visit) ────────────────────────────────────

  it("renders a skeleton (no button) when no location is known", () => {
    renderWithClient(<LocationPill {...locationPillEmpty} />);
    expect(screen.getByTestId(SKELETON_TEST_ID)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: CHANGE_LOCATION_PATTERN })).not.toBeInTheDocument();
  });

  it("treats an empty-string zip as no location and renders the skeleton", () => {
    renderWithClient(<LocationPill {...locationPillEmptyString} />);
    expect(screen.getByTestId(SKELETON_TEST_ID)).toBeInTheDocument();
  });

  it("swaps the skeleton for the pill when the ['location'] slice seeds (fingerprint enrich)", () => {
    const { queryClient } = renderWithClient(<LocationPill {...locationPillEmpty} />);
    expect(screen.getByTestId(SKELETON_TEST_ID)).toBeInTheDocument();

    act(() => {
      queryClient.setQueryData(LOCATION_QUERY_KEY, { zipCode: "27601" });
    });

    expect(screen.queryByTestId(SKELETON_TEST_ID)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: CHANGE_LOCATION_PATTERN })).toHaveTextContent(
      "27601"
    );
  });

  it("skeleton is aria-hidden decoration", () => {
    render(<LocationPillSkeleton />);
    expect(screen.getByTestId(SKELETON_TEST_ID)).toHaveAttribute("aria-hidden", "true");
  });

  // ─── Live location context ───────────────────────────────────────────

  it("prefers the ['location'] slice over the server prop when already seeded", () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(LOCATION_QUERY_KEY, { zipCode: "27601" });

    render(
      <QueryClientProvider client={queryClient}>
        <LocationPill {...locationPillDefault} />
      </QueryClientProvider>
    );

    expect(screen.getByRole("button", { name: CHANGE_LOCATION_PATTERN })).toHaveTextContent(
      "27601"
    );
  });

  it("updates live when the ['location'] slice changes after mount", () => {
    const { queryClient } = renderWithClient(<LocationPill {...locationPillDefault} />);
    expect(screen.getByRole("button", { name: CHANGE_LOCATION_PATTERN })).toHaveTextContent(
      "10001"
    );

    act(() => {
      queryClient.setQueryData(LOCATION_QUERY_KEY, { zipCode: "27601" });
    });

    expect(screen.getByRole("button", { name: CHANGE_LOCATION_PATTERN })).toHaveTextContent(
      "27601"
    );
  });

  it("ignores unrelated query cache updates", () => {
    const { queryClient } = renderWithClient(<LocationPill {...locationPillDefault} />);

    act(() => {
      queryClient.setQueryData(["unrelated"], { value: 1 });
    });

    expect(screen.getByRole("button", { name: CHANGE_LOCATION_PATTERN })).toHaveTextContent(
      "10001"
    );
  });

  it("does not throw when clicked", async () => {
    const user = userEvent.setup();
    renderWithClient(<LocationPill {...locationPillDefault} />);

    await expect(
      user.click(screen.getByRole("button", { name: CHANGE_LOCATION_PATTERN }))
    ).resolves.not.toThrow();
  });

  it("renders a decorative icon", () => {
    renderWithClient(<LocationPill {...locationPillDefault} />);
    const button = screen.getByRole("button", { name: CHANGE_LOCATION_PATTERN });
    const svg = button.querySelector("svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("opens the popover when the pill is clicked", async () => {
    const user = userEvent.setup();
    renderWithClient(<LocationPill {...locationPillDefault} />);
    await user.click(screen.getByRole("button", { name: CHANGE_LOCATION_PATTERN }));
    expect(screen.getByTestId("mock-zip-popover")).toBeInTheDocument();
  });

  // ─── Backdrop tests ──────────────────────────────────────────────────
  it("renders a backdrop element when the popover is open", async () => {
    const user = userEvent.setup();
    renderWithClient(<LocationPill {...locationPillDefault} />);
    await user.click(screen.getByRole("button", { name: CHANGE_LOCATION_PATTERN }));

    const backdrop = document.querySelector('[data-slot="popover-backdrop"]');
    expect(backdrop).toBeInTheDocument();
  });

  it("backdrop has the bg-overlay class for dark overlay styling", async () => {
    const user = userEvent.setup();
    renderWithClient(<LocationPill {...locationPillDefault} />);
    await user.click(screen.getByRole("button", { name: CHANGE_LOCATION_PATTERN }));

    const backdrop = document.querySelector('[data-slot="popover-backdrop"]');
    expect(backdrop).toHaveClass("bg-overlay");
  });

  it("backdrop is hidden when popover is closed", () => {
    renderWithClient(<LocationPill {...locationPillDefault} />);

    const backdrop = document.querySelector('[data-slot="popover-backdrop"]');
    expect(backdrop === null || backdrop.hasAttribute("hidden")).toBe(true);
  });

  it("popover content has correct Figma design tokens", async () => {
    const user = userEvent.setup();
    renderWithClient(<LocationPill {...locationPillDefault} />);
    await user.click(screen.getByRole("button", { name: CHANGE_LOCATION_PATTERN }));

    const content = document.querySelector('[data-slot="popover-content"]');
    expect(content).toBeInTheDocument();
    expect(content).toHaveClass("w-[362px]");
    expect(content).toHaveClass("rounded-lg");
    expect(content).toHaveClass("bg-surface-primary");
    expect(content).toHaveClass("p-5");
    expect(content).toHaveClass("shadow-lg");
    expect(content).toHaveClass("text-text-primary");
  });

  it("escape key dismisses the popover with backdrop", async () => {
    const user = userEvent.setup();
    renderWithClient(<LocationPill {...locationPillDefault} />);
    await user.click(screen.getByRole("button", { name: CHANGE_LOCATION_PATTERN }));
    expect(screen.getByTestId("mock-zip-popover")).toBeInTheDocument();

    await user.keyboard("{Escape}");

    expect(screen.queryByTestId("mock-zip-popover")).not.toBeInTheDocument();
  });
});
