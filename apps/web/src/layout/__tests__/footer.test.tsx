import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import { Footer } from "../footer";

const FOOTER_NAV_PATTERN = /footer navigation/i;
const LEGAL_LINKS_PATTERN = /legal links/i;
const LOCAL_DEALERS_PATTERN = /local dealers/i;
const PX_PATTERN = /px-/;
const GRID_COLS_PATTERN = /grid-cols-/;

describe("Footer (Assembly)", () => {
  it("renders a contentinfo (footer) landmark", () => {
    render(<Footer />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("contains a navigation landmark with 'Footer navigation' label", () => {
    render(<Footer />);
    const navs = screen.getAllByRole("navigation", { name: FOOTER_NAV_PATTERN });
    expect(navs.length).toBeGreaterThanOrEqual(1);
  });

  it("contains a navigation landmark with 'Legal links' label", () => {
    render(<Footer />);
    expect(screen.getByRole("navigation", { name: LEGAL_LINKS_PATTERN })).toBeInTheDocument();
  });

  it("renders the Local Dealers heading", () => {
    render(<Footer />);
    expect(screen.getByRole("heading", { name: LOCAL_DEALERS_PATTERN })).toBeInTheDocument();
  });

  it("uses bg-surface-primary background token", () => {
    const { container } = render(<Footer />);
    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toContain("bg-surface-primary");
  });

  it("uses the shared PageGrid for grid alignment", () => {
    render(<Footer />);
    const footer = screen.getByRole("contentinfo");
    const grid = footer.querySelector('[data-slot="page-grid"]');
    expect(grid).toBeInTheDocument();
  });

  it("applies horizontal padding to the grid container", () => {
    render(<Footer />);
    const footer = screen.getByRole("contentinfo");
    const grid = footer.querySelector('[data-slot="page-grid"]');
    // PageGrid applies horizontal padding (px-5/lg:px-10 or via CSS custom property)
    expect(grid?.className).toMatch(PX_PATTERN);
  });

  it("uses responsive grid columns", () => {
    render(<Footer />);
    const footer = screen.getByRole("contentinfo");
    const grid = footer.querySelector('[data-slot="page-grid"]');
    // PageGrid uses grid-cols (either hardcoded or via CSS variable)
    expect(grid?.className).toMatch(GRID_COLS_PATTERN);
  });
});
