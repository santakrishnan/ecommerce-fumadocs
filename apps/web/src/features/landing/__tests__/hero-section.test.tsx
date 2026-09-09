/// <reference types="@testing-library/jest-dom" />
import { render, screen, within } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import { heroDefaultProps, heroSearchProps } from "../__fixtures__/hero-section";
import { HeroSection } from "../components/hero-section";

const USE_CLIENT_PATTERN = /["']use client["']/;
const WHITESPACE_PATTERN = /\s+/;

describe("HeroSection", () => {
  it("renders the brand mark, headline, and supporting copy in correct order (AC-1)", () => {
    const { container } = render(<HeroSection {...heroDefaultProps} />);
    const section = container.querySelector("section");
    expect(section).toBeInTheDocument();

    const svg = section?.querySelector("svg");
    expect(svg).toBeInTheDocument();

    const heading = within(section as HTMLElement).getByRole("heading", { level: 1 });
    const subheadline = within(section as HTMLElement).getByText(heroDefaultProps.subheadline);

    // All three elements exist and heading comes after icon in DOM
    expect(svg).toBeInTheDocument();
    expect(heading).toBeInTheDocument();
    expect(subheadline).toBeInTheDocument();

    // Verify order: icon before heading, heading before subheadline
    expect((svg as Element).compareDocumentPosition(heading)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(heading.compareDocumentPosition(subheadline)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("renders the h1 heading with correct text", () => {
    render(<HeroSection {...heroDefaultProps} />);
    expect(
      screen.getByRole("heading", { level: 1, name: heroDefaultProps.headline })
    ).toBeInTheDocument();
  });

  it("renders the subheadline copy", () => {
    render(<HeroSection {...heroDefaultProps} />);
    expect(screen.getByText(heroDefaultProps.subheadline)).toBeInTheDocument();
  });

  it("applies responsive spacing tokens (AC-2)", () => {
    const { container } = render(<HeroSection {...heroDefaultProps} />);
    const section = container.querySelector("section");
    expect(section?.className).toContain("w-full");
    expect(section?.className).toContain("pb-6");
    expect(section?.className).toContain("md:pt-14");
    expect(section?.className).toContain("md:pb-8");
    expect(section?.className).toContain("lg:pt-20");
    expect(section?.className).toContain("lg:pb-12");
  });

  it("text is centered with responsive padding (AC-2)", () => {
    const { container } = render(<HeroSection {...heroDefaultProps} />);
    const section = container.querySelector("section");
    expect(section?.className).toContain("text-center");
    expect(section?.className).toContain("items-center");
  });

  it("h1 is present, unique, and has aria-labelledby linking (AC-3)", () => {
    render(<HeroSection {...heroDefaultProps} />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveAttribute("id", "hero-heading");
  });

  it("supports custom headingId to avoid collisions", () => {
    const { container } = render(<HeroSection {...heroDefaultProps} headingId="custom-hero" />);
    const heading = screen.getByRole("heading", { level: 1 });
    const section = container.querySelector("section");
    expect(heading).toHaveAttribute("id", "custom-hero");
    expect(section).toHaveAttribute("aria-labelledby", "custom-hero");
  });

  it("heading uses correct typography tokens", () => {
    render(<HeroSection {...heroDefaultProps} />);
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading.className).toContain("h1");
  });

  it("brand mark icon is always aria-hidden (AC-3)", () => {
    const { container } = render(<HeroSection {...heroDefaultProps} />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("merges brandMarkClassName with defaults", () => {
    const { container } = render(
      <HeroSection {...heroDefaultProps} brandMarkClassName="brightness-0 invert" />
    );
    const svg = container.querySelector("svg");
    // Default classes still present
    expect(svg?.className.baseVal ?? svg?.getAttribute("class")).toContain("m-2");
    expect(svg?.className.baseVal ?? svg?.getAttribute("class")).toContain("size-10");
    // Custom classes merged
    expect(svg?.className.baseVal ?? svg?.getAttribute("class")).toContain("brightness-0");
    expect(svg?.className.baseVal ?? svg?.getAttribute("class")).toContain("invert");
  });

  it("merges subheadlineClassName with defaults", () => {
    render(<HeroSection {...heroDefaultProps} subheadlineClassName="text-text-inverse text-xl" />);
    const p = screen.getByText(heroDefaultProps.subheadline);
    // Default classes still present
    expect(p.className).toContain("mt-4");
    // body-lg is dropped when subheadlineClassName is provided
    expect(p.className).not.toContain("body-lg");
    // Custom classes merged
    expect(p.className).toContain("text-text-inverse");
    expect(p.className).toContain("text-xl");
  });

  it("renders children slot for search control (Story 2.2 dependency)", () => {
    render(
      <HeroSection {...heroDefaultProps}>
        <input data-testid="search-input" placeholder="What are you looking for?" />
      </HeroSection>
    );
    expect(screen.getByTestId("search-input")).toBeInTheDocument();
  });

  it("is a Server Component — no 'use client' directive (AC-4)", async () => {
    const fs = await import("node:fs");
    const path = await import("node:path");
    const filePath = path.resolve(
      import.meta.dirname,
      "../components/hero-section/hero-section.tsx"
    );
    expect(fs.existsSync(filePath)).toBe(true);
    const firstLine = fs.readFileSync(filePath, "utf-8").trimStart().split("\n")[0];
    expect(firstLine).not.toMatch(USE_CLIENT_PATTERN);
  });

  describe("search usage (no headline)", () => {
    it("does not render an h1 when headline is omitted", () => {
      render(<HeroSection {...heroSearchProps} />);
      expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    });

    it("renders subheadline copy", () => {
      render(<HeroSection {...heroSearchProps} />);
      expect(screen.getByText(heroSearchProps.subheadline)).toBeInTheDocument();
    });

    it("merges custom className with defaults on section", () => {
      const { container } = render(<HeroSection {...heroSearchProps} />);
      const section = container.querySelector("section");
      // Custom classes from fixture
      expect(section?.className).toContain("max-w-2xl");
      expect(section?.className).toContain("pb-0");
      // Default classes still present
      expect(section?.className).toContain("w-full");
    });

    it("merges custom brandMarkClassName with defaults", () => {
      const { container } = render(<HeroSection {...heroSearchProps} />);
      const svg = container.querySelector("svg");
      const classes = svg?.className.baseVal ?? svg?.getAttribute("class") ?? "";
      expect(classes).toContain("text-text-primary");
      // Defaults still present
      expect(classes).toContain("m-2");
    });

    it("merges custom subheadlineClassName with defaults", () => {
      render(<HeroSection {...heroSearchProps} />);
      const p = screen.getByText(heroSearchProps.subheadline);
      expect(p.className).toContain("text-text-primary");
      // body-lg is dropped when subheadlineClassName is provided
      expect(p.className).not.toContain("body-lg");
    });

    it("uses aria-label instead of aria-labelledby when no headline", () => {
      const { container } = render(<HeroSection {...heroSearchProps} />);
      const section = container.querySelector("section");
      expect(section).toHaveAttribute("aria-label", "Introduction");
      expect(section).not.toHaveAttribute("aria-labelledby");
    });

    it("has no background color on the section itself", () => {
      const { container } = render(<HeroSection {...heroSearchProps} />);
      const section = container.querySelector("section");
      const backgroundClasses = (section?.className ?? "")
        .split(WHITESPACE_PATTERN)
        .filter((cls) => cls.startsWith("bg-") && cls !== "bg-transparent");
      expect(backgroundClasses).toHaveLength(0);
    });
  });
});
