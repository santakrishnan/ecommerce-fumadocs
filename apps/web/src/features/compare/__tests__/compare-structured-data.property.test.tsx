import { cleanup, render } from "@ucmp/vitest-config/test-utils";
import fc from "fast-check";
import { formatPrice } from "utils";
import { afterEach, describe, expect, it } from "vitest";
import type { CompareVehicle } from "../__fixtures__/compare-vehicles.fixture";
import { makeCompareVehicle } from "../__fixtures__/compare-vehicles.fixture";
import { CompareStructuredData, toVehicleJsonLd } from "../components/compare-structured-data";
import { toVehicleLabel } from "../lib/compare-metadata";
import { toPriceAndValueAttributes } from "../lib/to-comparison-table";

// Uppercase alnum chars for a realistic 17-char VIN.
const VIN_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789".split("");
const vinArb = fc
  .array(fc.constantFrom(...VIN_CHARS), { minLength: 17, maxLength: 17 })
  .map((chars) => chars.join(""));

// Non-empty text tokens (letters/digits/space) with real content after trimming,
// so "complete" vehicles always carry a make/model/trim.
const TEXT_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789".split("");
const textArb = fc
  .array(fc.constantFrom(...TEXT_CHARS), { minLength: 1, maxLength: 12 })
  .map((chars) => chars.join(""));

const yearArb = fc.integer({ min: 1950, max: 2030 });
const priceArb = fc.integer({ min: 1, max: 500_000 });

// A vehicle with complete data across every JSON-LD fact.
const completeVehicleArb = fc
  .record({
    vin: vinArb,
    year: yearArb,
    make: textArb,
    model: textArb,
    trim: textArb,
    sellingPrice: priceArb,
  })
  .map(({ sellingPrice, ...rest }) =>
    makeCompareVehicle({ ...rest, pricing: { sellingPrice } as CompareVehicle["pricing"] })
  );

const vehicleSetArb = fc.array(completeVehicleArb, { minLength: 1, maxLength: 5 });

function parseScripts(container: HTMLElement) {
  const scripts = container.querySelectorAll('script[type="application/ld+json"]');
  return Array.from(scripts).map((script) => JSON.parse(script.textContent ?? ""));
}

describe("CompareStructuredData completeness", () => {
  afterEach(cleanup);

  // Feature: compare-seo-structured-data, Property 6: Structured data emits one complete Vehicle node per vehicle
  it("emits exactly one complete Vehicle node per compared vehicle", () => {
    fc.assert(
      fc.property(vehicleSetArb, (vehicles) => {
        // Mapper-level completeness: one complete node per vehicle.
        const nodes = vehicles.map(toVehicleJsonLd);
        expect(nodes).toHaveLength(vehicles.length);

        for (const node of nodes) {
          expect(node["@context"]).toBe("https://schema.org");
          expect(node["@type"]).toBe("Vehicle");
          expect(typeof node.name).toBe("string");
          expect(node.name.length).toBeGreaterThan(0);
          expect(typeof node.brand).toBe("string");
          expect(node.brand.length).toBeGreaterThan(0);
          expect(typeof node.model).toBe("string");
          expect(node.model.length).toBeGreaterThan(0);
          expect(typeof node.vehicleModelDate).toBe("number");
          expect(node.vehicleIdentificationNumber).toHaveLength(17);
          expect(node.offers?.["@type"]).toBe("Offer");
          expect(typeof node.offers?.price).toBe("number");
          expect(node.offers?.priceCurrency).toBe("USD");
        }

        // Component-level: one script per vehicle in the rendered output.
        const { container } = render(<CompareStructuredData vehicles={vehicles} />);
        const rendered = parseScripts(container);
        expect(rendered).toHaveLength(vehicles.length);
        for (const node of rendered) {
          expect(node["@context"]).toBe("https://schema.org");
          expect(node["@type"]).toBe("Vehicle");
        }
        cleanup();
      }),
      { numRuns: 25 }
    );
  });
});

describe("CompareStructuredData fact-visibility matching and omission", () => {
  // Feature: compare-seo-structured-data, Property 7: Structured data matches visible facts and omits unavailable ones
  it("matches every emitted fact to its visible value and omits unavailable facts", () => {
    fc.assert(
      fc.property(completeVehicleArb, (vehicle) => {
        const node = toVehicleJsonLd(vehicle);

        // Every present fact equals the corresponding rendered/visible value.
        expect(node.name).toBe(toVehicleLabel(vehicle));
        expect(node.brand).toBe(vehicle.make);
        expect(node.model).toBe(vehicle.model);
        expect(node.vehicleModelDate).toBe(vehicle.year);
        expect(node.vehicleIdentificationNumber).toBe(vehicle.vin);

        // The offer price equals the source price and formats to the visible cell.
        expect(node.offers?.price).toBe(vehicle.pricing.sellingPrice);
        const [priceRow] = toPriceAndValueAttributes([vehicle]);
        const visiblePriceCell = priceRow?.cells[0]?.value;
        expect(formatPrice(node.offers?.price as number)).toBe(visiblePriceCell);

        // With an unavailable selling price the offer is omitted, the node still stands.
        const noPrice = makeCompareVehicle({
          ...vehicle,
          pricing: { ...vehicle.pricing, sellingPrice: Number.NaN },
        });
        const omittedNode = toVehicleJsonLd(noPrice);
        expect(omittedNode.offers).toBeUndefined();
        expect(omittedNode.name).toBe(toVehicleLabel(vehicle));
        expect(omittedNode.brand).toBe(vehicle.make);
        expect(omittedNode.model).toBe(vehicle.model);
        expect(omittedNode.vehicleModelDate).toBe(vehicle.year);
        expect(omittedNode.vehicleIdentificationNumber).toBe(vehicle.vin);
      }),
      { numRuns: 25 }
    );
  });
});
