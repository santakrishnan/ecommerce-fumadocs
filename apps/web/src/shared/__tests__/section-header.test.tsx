/// <reference types="@testing-library/jest-dom" />

import { SectionHeader } from "@shared/components/section-header";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";

const BROWSE_BY_STYLE_REGEX = /browse by style/i;

describe("SectionHeader", () => {
  it("renders the title as a bold uppercase h2", () => {
    render(<SectionHeader subtitle="Find your match" title="Browse by Style" />);

    const heading = screen.getByRole("heading", { level: 2, name: BROWSE_BY_STYLE_REGEX });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass("carousel-headline", "text-text-primary");
  });

  it("renders the subtitle with correct styling", () => {
    render(<SectionHeader subtitle="These cars are priced to sell" title="Browse by Style" />);

    const subtitle = screen.getByText("These cars are priced to sell");
    expect(subtitle).toBeInTheDocument();
    expect(subtitle.tagName).toBe("P");
    expect(subtitle).toHaveClass("body-md", "text-text-subtle");
    expect(subtitle).not.toHaveClass("body-sm", "xl:body-md", "lg:disclaimer");
  });

  it("renders the icon at size-4 to the left of the title when provided", () => {
    render(
      <SectionHeader
        icon={<svg data-testid="test-icon" />}
        subtitle="Find your match"
        title="Browse by Style"
      />
    );

    const icon = screen.getByTestId("test-icon");
    expect(icon).toBeInTheDocument();

    // Icon container should be size-4 with inline-flex
    const iconContainer = icon.parentElement;
    expect(iconContainer).toHaveClass("inline-flex", "size-4", "shrink-0");

    // Outer wrapper should use inline-flex alignment with gap
    const outerWrapper = iconContainer?.parentElement;
    expect(outerWrapper).toHaveClass("inline-flex", "items-center", "gap-2");
  });

  it("renders without icon space or gap when no icon is provided", () => {
    render(<SectionHeader subtitle="Find your match" title="Browse by Style" />);

    const heading = screen.getByRole("heading", { level: 2 });
    // When no icon, the title text is a direct child — no inline-flex wrapper
    expect(heading.querySelector(".inline-flex")).toBeNull();
    expect(heading.textContent).toBe("Browse by Style");
  });

  it("uses semantic h2 heading for accessibility", () => {
    render(<SectionHeader subtitle="Top picks" title="Featured Vehicles" />);

    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading).toBeInTheDocument();
    expect(heading.tagName).toBe("H2");
  });

  it("renders children when provided", () => {
    render(
      <SectionHeader subtitle="Find your match" title="Browse by Style">
        <div data-testid="child-content">Child content</div>
      </SectionHeader>
    );

    expect(screen.getByTestId("child-content")).toBeInTheDocument();
  });
});
