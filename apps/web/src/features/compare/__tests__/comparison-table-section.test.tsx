import { render, screen, within } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import { COMPARE_VEHICLES_FIXTURE } from "../__fixtures__/compare-vehicles.fixture";
import { ComparisonTableSection } from "../components/comparison-table-section";
import { toComparisonVehicles, toPriceAndValueAttributes } from "../lib/to-comparison-table";

const comparedVehicles = COMPARE_VEHICLES_FIXTURE.slice(0, 3);
const vehicles = toComparisonVehicles(comparedVehicles);
const attributes = toPriceAndValueAttributes(comparedVehicles);

describe("ComparisonTableSection", () => {
  it("renders the section title as a heading", () => {
    render(
      <ComparisonTableSection attributes={attributes} title="Price & Value" vehicles={vehicles} />
    );

    expect(screen.getByRole("heading", { name: "Price & Value" })).toBeInTheDocument();
  });

  it("renders one column header per vehicle", () => {
    render(
      <ComparisonTableSection attributes={attributes} title="Price & Value" vehicles={vehicles} />
    );

    for (const vehicle of vehicles) {
      expect(screen.getByRole("columnheader", { name: vehicle.name })).toBeInTheDocument();
    }
  });

  it("renders one row per attribute plus the header row", () => {
    render(
      <ComparisonTableSection attributes={attributes} title="Price & Value" vehicles={vehicles} />
    );

    const rows = screen.getAllByRole("row");
    expect(rows).toHaveLength(attributes.length + 1);
  });

  it("renders each cell label and value", () => {
    render(
      <ComparisonTableSection attributes={attributes} title="Price & Value" vehicles={vehicles} />
    );

    const [sellingPrice] = attributes;
    for (const cell of sellingPrice?.cells ?? []) {
      expect(screen.getByText(cell.value)).toBeInTheDocument();
    }
    expect(screen.getAllByText("Selling price")).toHaveLength(vehicles.length);
  });

  it("supports a different number of vehicle columns", () => {
    const twoVehicles = vehicles.slice(0, 2);
    const twoColumnAttributes = attributes.map((attribute) => ({
      ...attribute,
      cells: attribute.cells.slice(0, 2),
    }));

    render(
      <ComparisonTableSection
        attributes={twoColumnAttributes}
        title="Price & Value"
        vehicles={twoVehicles}
      />
    );

    expect(screen.getAllByRole("columnheader")).toHaveLength(twoVehicles.length);
  });

  it("labels the table with its section heading", () => {
    render(
      <ComparisonTableSection attributes={attributes} title="Price & Value" vehicles={vehicles} />
    );

    expect(screen.getByRole("table", { name: "Price & Value" })).toBeInTheDocument();
  });

  it("renders each column header as a th[scope=col] inside the labelled table", () => {
    render(
      <ComparisonTableSection attributes={attributes} title="Price & Value" vehicles={vehicles} />
    );

    // Headers must live inside the table that the section title labels.
    const table = screen.getByRole("table", { name: "Price & Value" });
    const headers = within(table).getAllByRole("columnheader");
    expect(headers).toHaveLength(vehicles.length);

    for (const header of headers) {
      expect(header.tagName).toBe("TH");
      expect(header).toHaveAttribute("scope", "col");
      expect(table).toContainElement(header);
    }
  });

  it("applies slot class overrides", () => {
    render(
      <ComparisonTableSection
        attributes={attributes}
        classNames={{ heading: "custom-heading" }}
        title="Price & Value"
        vehicles={vehicles}
      />
    );

    expect(screen.getByRole("heading", { name: "Price & Value" })).toHaveClass("custom-heading");
  });

  it("renders the value with the compact density variant", () => {
    render(
      <ComparisonTableSection
        attributes={attributes}
        density="compact"
        title="Price & Value"
        vehicles={vehicles}
      />
    );

    const firstValue = attributes[0]?.cells[0]?.value ?? "";
    const table = screen.getByRole("table");
    const value = within(table).getByText(firstValue);
    expect(value).toHaveClass("subhead-sm");
  });
});
