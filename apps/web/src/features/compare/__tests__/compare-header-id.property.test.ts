// @vitest-environment node
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { parseVinFromHeaderId, toColumnHeaderId } from "../lib/compare-header-id";

// Feature: compare-seo-structured-data, Property 3: Column header id is VIN-recoverable, unique, and deterministic

// VINs use the real charset (uppercase alnum) plus hyphens so the round-trip is exercised
// against ids whose embedded VIN itself contains the separator character.
const VIN_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
const realisticVin = fc
  .array(fc.constantFrom(...VIN_CHARS), { minLength: 17, maxLength: 17 })
  .map((chars) => chars.join(""));
const hyphenatedVin = fc
  .array(fc.constantFrom(...VIN_CHARS, "-"), { minLength: 1, maxLength: 20 })
  .map((chars) => chars.join(""));
const vinArb = fc.oneof(realisticVin, hyphenatedVin);

// Multi-table config: each table gets a distinct index-derived tableId; columns pull from a
// shared VIN pool so duplicate VINs across columns/tables occur frequently.
const configArb = fc
  .array(vinArb, { minLength: 1, maxLength: 6 })
  .chain((pool) =>
    fc.array(fc.array(fc.constantFrom(...pool), { minLength: 1, maxLength: 5 }), {
      minLength: 1,
      maxLength: 4,
    })
  )
  .map((tables) =>
    tables.map((vins, tableIndex) => ({
      tableId: `table-${tableIndex}`,
      columns: vins.map((vin, columnIndex) => ({ columnIndex, vin })),
    }))
  );

describe("compare-header-id round-trip, uniqueness, determinism", () => {
  it("recovers the VIN, produces unique ids, and is deterministic", () => {
    fc.assert(
      fc.property(configArb, (tables) => {
        const ids: string[] = [];

        for (const table of tables) {
          for (const column of table.columns) {
            const input = {
              tableId: table.tableId,
              columnIndex: column.columnIndex,
              vin: column.vin,
            };
            const id = toColumnHeaderId(input);

            // Round-trip: the embedded VIN is recoverable verbatim.
            expect(parseVinFromHeaderId(id)).toBe(column.vin);
            // Determinism: same input yields an identical string.
            expect(toColumnHeaderId(input)).toBe(id);

            ids.push(id);
          }
        }

        // Uniqueness: (tableId, columnIndex) disambiguates even when VINs repeat.
        expect(new Set(ids).size).toBe(ids.length);
      }),
      { numRuns: 25 }
    );
  });
});
