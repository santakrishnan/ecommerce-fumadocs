/// <reference types="@testing-library/jest-dom" />

import { act, render, screen, userEvent, waitFor, within } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import {
  COMPARE_SECTION_HISTORY,
  COMPARE_SECTION_INTERIOR,
  COMPARE_SECTION_PERFORMANCE,
  COMPARE_SECTION_PRICE_VALUE,
  COMPARE_SECTION_SAFETY,
} from "../__fixtures__/compare-sections.fixture";
import { COMPARE_VEHICLES_FIXTURE } from "../__fixtures__/compare-vehicles.fixture";
import { type CompareComparisonSection, CompareSection } from "../components/compare-section";
import { toComparisonVehicles, toPriceAndValueAttributes } from "../lib/to-comparison-table";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => "/profile/watchlist",
  useSearchParams: () => mockSearchParams,
}));

// ─── Realistic props mirroring the compare-demo page ──────────────────────────

const allVehicles = COMPARE_VEHICLES_FIXTURE;
const initialSelectedVins = COMPARE_VEHICLES_FIXTURE.slice(0, 5).map((v) => v.vin);

const sections: CompareComparisonSection[] = [
  {
    title: COMPARE_SECTION_PRICE_VALUE.title,
    category: "price-value",
    faq: COMPARE_SECTION_PRICE_VALUE.faq,
  },
  {
    title: COMPARE_SECTION_PERFORMANCE.title,
    category: "performance",
    faq: COMPARE_SECTION_PERFORMANCE.faq,
  },
  {
    title: COMPARE_SECTION_INTERIOR.title,
    category: "interior",
    faq: COMPARE_SECTION_INTERIOR.faq,
  },
  { title: COMPARE_SECTION_SAFETY.title, category: "safety", faq: COMPARE_SECTION_SAFETY.faq },
  { title: COMPARE_SECTION_HISTORY.title, category: "history", faq: COMPARE_SECTION_HISTORY.faq },
];

const SELECTOR_TRIGGER_REGEX = /select vehicle for comparison/i;

function renderSection() {
  return render(
    <CompareSection
      allVehicles={allVehicles}
      initialSelectedVins={initialSelectedVins}
      sections={sections}
    />
  );
}

/** Column values for a single vehicle, using the same mapper the page uses. */
function priceValueColumn(vehicle: (typeof COMPARE_VEHICLES_FIXTURE)[number]): string[] {
  return toPriceAndValueAttributes([vehicle]).map((attr) => attr.cells[0]?.value ?? "");
}

describe("CompareSection", () => {
  it("renders the vehicle selector carousel with one selector per column", () => {
    renderSection();

    const triggers = screen.getAllByRole("button", { name: SELECTOR_TRIGGER_REGEX });
    expect(triggers).toHaveLength(initialSelectedVins.length);
  });

  it("renders one comparison table per category section", () => {
    renderSection();

    expect(screen.getAllByRole("table")).toHaveLength(sections.length);
  });

  it("compacts on downward scroll and expands again at the top", () => {
    let scrollY = 0;
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      get: () => scrollY,
    });

    renderSection();

    const stickyStrip = document.querySelector("[data-compact]") as HTMLDivElement | null;
    // The first CompareCardMorph root div (carries the morphing layout classes)
    const desktopCard = stickyStrip?.querySelector("[class*='rounded-xl']") as HTMLElement | null;
    expect(stickyStrip).toHaveAttribute("data-compact", "false");
    expect(desktopCard).toHaveClass("flex-col");
    expect(desktopCard).not.toHaveClass("h-24");

    scrollY = 12;
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });

    expect(stickyStrip).toHaveAttribute("data-compact", "true");
    expect(desktopCard).toHaveClass("h-24", "flex-row");
    expect(desktopCard).not.toHaveClass("flex-col");

    scrollY = 8;
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });

    expect(stickyStrip).toHaveAttribute("data-compact", "true");
    expect(desktopCard).toHaveClass("h-24", "flex-row");

    scrollY = 0;
    act(() => {
      window.dispatchEvent(new Event("scroll"));
    });

    expect(stickyStrip).toHaveAttribute("data-compact", "false");
    expect(desktopCard).toHaveClass("flex-col");
    expect(desktopCard).not.toHaveClass("h-27");
  });

  it("switching a column updates its header text and every cell value in that column", async () => {
    const user = userEvent.setup();
    renderSection();

    const initialVehicle = allVehicles[0]; // rav4 — column 0
    // A vehicle not in the initial columns, so the switch is a genuine change.
    const newVehicle = allVehicles.at(-1); // priusPrime
    if (!(initialVehicle && newVehicle)) {
      throw new Error("fixture is missing expected vehicles");
    }
    const initialName = toComparisonVehicles([initialVehicle])[0]?.name ?? "";
    const newName = toComparisonVehicles([newVehicle])[0]?.name ?? "";

    // Pre-switch: column 0 of the first (Price & Value) table shows the initial vehicle.
    const priceTableBefore = screen.getAllByRole("table")[0] as HTMLElement;
    const columnCount = within(priceTableBefore).getAllByRole("columnheader").length;
    const header0Before = within(priceTableBefore).getAllByRole("columnheader")[0] as HTMLElement;
    expect(header0Before).toHaveTextContent(initialName);

    const cellsBefore = within(priceTableBefore).getAllByRole("cell");
    const column0Before = cellsBefore.filter((_, i) => i % columnCount === 0);
    for (const [rowIndex, value] of priceValueColumn(initialVehicle).entries()) {
      expect(column0Before[rowIndex]).toHaveTextContent(value);
    }

    // Open the first column's selector and choose the new vehicle.
    await user.click(
      screen.getAllByRole("button", { name: SELECTOR_TRIGGER_REGEX })[0] as HTMLElement
    );
    // The carousel renders responsive md+ and mobile dropdowns (both in the DOM
    // under jsdom); either listbox exposes the same options, so scope to the first.
    const listbox = screen.getAllByRole("listbox")[0] as HTMLElement;
    const options = within(listbox).getAllByRole("option");
    const newVehicleIndex = allVehicles.length - 1;
    await user.click(options[newVehicleIndex] as HTMLElement);

    // The swap runs through a short fade/pause animation before the data updates,
    // so wait for column 0's header to reflect the newly selected vehicle.
    // The swap runs through a short fade/pause animation before the data
    // settles, during which the old and new values briefly coexist and the
    // header updates a beat before the body cells. Wait until the whole
    // column 0 reflects the newly selected vehicle: header shows the new name
    // (and not the old one) and every column-0 cell shows the new value.
    await waitFor(() => {
      const table = screen.getAllByRole("table")[0] as HTMLElement;
      const header0 = within(table).getAllByRole("columnheader")[0] as HTMLElement;
      expect(header0).toHaveTextContent(newName);
      expect(header0).not.toHaveTextContent(initialName);

      const cells = within(table).getAllByRole("cell");
      const column0 = cells.filter((_, i) => i % columnCount === 0);
      for (const [rowIndex, value] of priceValueColumn(newVehicle).entries()) {
        expect(column0[rowIndex]).toHaveTextContent(value);
      }
    });
  });
});
