/// <reference types="@testing-library/jest-dom" />
import { fireEvent, render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it, vi } from "vitest";
import { SPECS_FIXTURE_FULL } from "../__fixtures__/vehicle-specs.fixture";
import { VdpFeatures } from "../components/vdp-features";

const VIEW_REPORT_PATTERN = /view report/i;
const VIEW_ALL_FEATURES_PATTERN = /view all features/i;

const defaultProps = {
  carfaxReportUrl: SPECS_FIXTURE_FULL.carfax.reportUrl,
  carfaxStatus: `${SPECS_FIXTURE_FULL.carfax.ownerCount}-owner vehicle, accident free`,
  keyFeatures: SPECS_FIXTURE_FULL.features,
  warrantyValue: `${SPECS_FIXTURE_FULL.warranty.type} · ${SPECS_FIXTURE_FULL.warranty.expiration}`,
};

describe("VdpFeatures", () => {
  it("renders the main sections and report link", () => {
    render(<VdpFeatures {...defaultProps} />);

    expect(screen.getByRole("img", { name: "CARFAX" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Warranty" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Key Features" })).toBeInTheDocument();

    const reportLinkLabel = screen.getByText(VIEW_REPORT_PATTERN);
    const reportLink = reportLinkLabel.closest("a");

    expect(reportLink !== null).toBe(true);

    if (reportLink === null) {
      throw new Error("Expected report link anchor");
    }

    expect(reportLink).toHaveAttribute("href", SPECS_FIXTURE_FULL.carfax.reportUrl);
  });

  it("limits visible features and calls the view-all handler", () => {
    const onViewAllFeatures = vi.fn();
    const fixtureFeatures = SPECS_FIXTURE_FULL.features.slice(0, 3);

    expect(fixtureFeatures).toHaveLength(3);

    if (fixtureFeatures.length !== 3) {
      throw new Error("Expected at least three fixture features");
    }

    const [firstFeature, secondFeature, thirdFeature] = fixtureFeatures as [string, string, string];

    render(
      <VdpFeatures {...defaultProps} maxVisibleFeatures={2} onViewAllFeatures={onViewAllFeatures} />
    );

    expect(screen.getByText(firstFeature)).toBeInTheDocument();
    expect(screen.getByText(secondFeature)).toBeInTheDocument();
    expect(screen.queryByText(thirdFeature) === null).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: VIEW_ALL_FEATURES_PATTERN }));
    expect(onViewAllFeatures).toHaveBeenCalledTimes(1);
  });

  it("renders the view-all button when no handler is provided", () => {
    render(<VdpFeatures {...defaultProps} />);

    expect(screen.getByRole("button", { name: VIEW_ALL_FEATURES_PATTERN })).toBeInTheDocument();
  });
});
