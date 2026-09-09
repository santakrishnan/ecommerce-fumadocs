/// <reference types="@testing-library/jest-dom" />
import { cleanup, render } from "@ucmp/vitest-config/test-utils";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  COMPARE_VEHICLES_FIXTURE,
  type CompareVehicle,
} from "../__fixtures__/compare-vehicles.fixture";
import { ComparisonTableSection } from "../components/comparison-table-section";
import { parseVinFromHeaderId } from "../lib/compare-header-id";
import { toComparisonVehicles, toPriceAndValueAttributes } from "../lib/to-comparison-table";

const NUM_RUNS = 25;
const TITLE = "Price & Value";
const WHITESPACE = /\s+/;

/** Random 1–5 vehicle column set drawn from the fixture (duplicates allowed). */
const compareVehiclesArb = fc.array(fc.constantFrom(...COMPARE_VEHICLES_FIXTURE), {
  minLength: 1,
  maxLength: 5,
});

function renderTable(vehicles: CompareVehicle[]) {
  return render(
    <ComparisonTableSection
      attributes={toPriceAndValueAttributes(vehicles)}
      title={TITLE}
      vehicles={toComparisonVehicles(vehicles)}
    />
  );
}

/** Ordered column-header ids from the single table in `container`. */
function columnHeaderIds(container: HTMLElement): string[] {
  const table = container.querySelector("table");
  if (!table) {
    throw new Error("Expected a rendered table");
  }
  const headers = table.querySelectorAll<HTMLTableCellElement>('thead th[scope="col"]');
  return Array.from(headers, (th) => th.id);
}

/** Rows of `<td>` elements from the table body, in column order. */
function bodyCellRows(container: HTMLElement): HTMLTableCellElement[][] {
  const table = container.querySelector("table");
  if (!table) {
    throw new Error("Expected a rendered table");
  }
  const rows = table.querySelectorAll<HTMLTableRowElement>("tbody tr");
  return Array.from(rows, (row) => Array.from(row.querySelectorAll("td")));
}

describe("ComparisonTableSection id/headers association (property-based)", () => {
  // Feature: compare-seo-structured-data, Property 4: Every data cell is associated with exactly its column header
  it("associates every data cell with exactly its column header", () => {
    fc.assert(
      fc.property(compareVehiclesArb, (vehicles) => {
        const { container } = renderTable(vehicles);
        const table = container.querySelector("table");
        if (!table) {
          throw new Error("Expected a rendered table");
        }

        const headerIds = columnHeaderIds(container);

        for (const row of bodyCellRows(container)) {
          row.forEach((cell, columnIndex) => {
            const headers = cell.getAttribute("headers") ?? "";

            // Single, non-empty token.
            expect(headers.length).toBeGreaterThan(0);
            expect(headers.split(WHITESPACE)).toHaveLength(1);

            // Matches the id of the header for this column.
            expect(headers).toBe(headerIds[columnIndex]);

            // Resolves to exactly one <th> in the same table.
            const matching = table.querySelectorAll<HTMLTableCellElement>('thead th[scope="col"]');
            const resolved = Array.from(matching).filter((th) => th.id === headers);
            expect(resolved).toHaveLength(1);
          });
        }

        cleanup();
      }),
      { numRuns: NUM_RUNS }
    );
  });

  // Feature: compare-seo-structured-data, Property 5: Column switch preserves association and uniqueness
  it("preserves association and uniqueness after a column switch", () => {
    const switchArb = compareVehiclesArb.chain((vehicles) =>
      fc.record({
        vehicles: fc.constant(vehicles),
        switchIndex: fc.integer({ min: 0, max: vehicles.length - 1 }),
        newVehicle: fc.constantFrom(...COMPARE_VEHICLES_FIXTURE),
      })
    );

    fc.assert(
      fc.property(switchArb, ({ vehicles, switchIndex, newVehicle }) => {
        const { container, rerender } = renderTable(vehicles);

        // Simulate the parent re-rendering with one column switched.
        const switched = vehicles.map((vehicle, index) =>
          index === switchIndex ? newVehicle : vehicle
        );
        rerender(
          <ComparisonTableSection
            attributes={toPriceAndValueAttributes(switched)}
            title={TITLE}
            vehicles={toComparisonVehicles(switched)}
          />
        );

        const headerIds = columnHeaderIds(container);

        // The switched column's header id embeds the newly selected VIN.
        expect(parseVinFromHeaderId(headerIds[switchIndex] ?? "")).toBe(newVehicle.vin);

        // All header ids remain unique.
        expect(new Set(headerIds).size).toBe(headerIds.length);

        // Every cell in the switched column references the current header id.
        const validIds = new Set(headerIds);
        for (const row of bodyCellRows(container)) {
          const cell = row[switchIndex];
          expect(cell?.getAttribute("headers")).toBe(headerIds[switchIndex]);

          // No cell anywhere points at a stale/non-existent header.
          for (const anyCell of row) {
            expect(validIds.has(anyCell.getAttribute("headers") ?? "")).toBe(true);
          }
        }

        cleanup();
      }),
      { numRuns: NUM_RUNS }
    );
  });

  // Feature: compare-seo-structured-data, Property 8: Visible cell text is preserved
  it("preserves the visible label and value text of every cell", () => {
    fc.assert(
      fc.property(compareVehiclesArb, (vehicles) => {
        const attributes = toPriceAndValueAttributes(vehicles);
        const { container } = renderTable(vehicles);

        const rows = bodyCellRows(container);
        rows.forEach((row, rowIndex) => {
          row.forEach((cell, columnIndex) => {
            const source = attributes[rowIndex]?.cells[columnIndex];
            const label = cell.querySelector('[data-slot="comparison-table-section-label"]');
            const value = cell.querySelector('[data-slot="comparison-table-section-value"]');

            expect(label?.textContent).toBe(source?.label);
            expect(value?.textContent).toBe(source?.value);
          });
        });

        cleanup();
      }),
      { numRuns: NUM_RUNS }
    );
  });
});
