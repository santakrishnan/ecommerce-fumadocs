import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import { FooterTop } from "../footer-top";

const LOCAL_DEALERS_PATTERN = /local dealers/i;
const TAGLINE_PATTERN = /find a dealer near you/i;

describe("FooterTop", () => {
  const defaultProps = {
    brandName: "Local Dealers",
    tagline: "Find a dealer near you",
  };

  it("renders the brand name as a heading", () => {
    render(<FooterTop {...defaultProps} />);
    expect(screen.getByRole("heading", { name: LOCAL_DEALERS_PATTERN })).toBeInTheDocument();
  });

  it("renders the tagline text", () => {
    render(<FooterTop {...defaultProps} />);
    expect(screen.getByText(TAGLINE_PATTERN)).toBeInTheDocument();
  });

  it("renders the arrow indicator", () => {
    render(<FooterTop {...defaultProps} />);
    const icon = document.querySelector('[data-slot="icon"]');
    expect(icon).toBeInTheDocument();
  });

  it("uses design token for text color (text-text-primary)", () => {
    render(<FooterTop {...defaultProps} />);
    const heading = screen.getByRole("heading", { name: LOCAL_DEALERS_PATTERN });
    expect(heading.className).toContain("text-text-primary");
  });

  it("uses subhead-sm typography utility for heading", () => {
    render(<FooterTop {...defaultProps} />);
    const heading = screen.getByRole("heading", { name: LOCAL_DEALERS_PATTERN });
    expect(heading.className).toContain("subhead-sm");
  });
});
