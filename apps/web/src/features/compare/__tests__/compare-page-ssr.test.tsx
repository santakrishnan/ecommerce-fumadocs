import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { COMPARE_VEHICLES_FIXTURE } from "../__fixtures__/compare-vehicles.fixture";
import { CompareStructuredData } from "../components/compare-structured-data";
import {
  buildCompareDescription,
  buildCompareTitle,
  toVehicleLabel,
} from "../lib/compare-metadata";

const INITIAL_COMPARE_COUNT = 5;
const initialVehicles = COMPARE_VEHICLES_FIXTURE.slice(0, INITIAL_COMPARE_COUNT);

describe("Compare page — crawlable initial render", () => {
  it("server-renders one JSON-LD script per initial vehicle without hydration", () => {
    // renderToStaticMarkup produces no-hydration server HTML — what a crawler sees.
    const html = renderToStaticMarkup(<CompareStructuredData vehicles={initialVehicles} />);

    const scripts = html.match(/application\/ld\+json/g) ?? [];
    expect(scripts).toHaveLength(initialVehicles.length);

    const nodes = Array.from(
      html.matchAll(/<script[^>]*application\/ld\+json[^>]*>(.*?)<\/script>/gs)
    ).map(([, body]) =>
      JSON.parse(
        (body ?? "")
          .replace(/\\u003c/g, "<")
          .replace(/\\u003e/g, ">")
          .replace(/\\u0026/g, "&")
      )
    );
    expect(nodes).toHaveLength(initialVehicles.length);
    for (const node of nodes) {
      expect(node["@type"]).toBe("Vehicle");
      expect(node["@context"]).toBe("https://schema.org");
    }
  });

  it("derives crawlable metadata from the same initial vehicle slice as the structured data", () => {
    const labels = initialVehicles.map(toVehicleLabel);
    const title = buildCompareTitle(labels);
    const description = buildCompareDescription(labels);

    // Title reflects the initial vehicles (at least the first one's label).
    const [firstLabel] = labels;
    expect(title).toContain((firstLabel ?? "").split(" ")[0]);
    expect(description).toContain((firstLabel ?? "").split(" ")[0]);
  });
});
