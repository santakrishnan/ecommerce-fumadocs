import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import { FooterNavigation } from "../footer-navigation";

const YOUTUBE_PATTERN = /youtube/i;
const INSTAGRAM_PATTERN = /instagram/i;
const TIKTOK_PATTERN = /tiktok/i;

describe("FooterNavigation", () => {
  it("renders navigation group headings for all sections", () => {
    render(<FooterNavigation />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    // Desktop columns (5) + mobile accordion triggers (5) = 10
    expect(headings).toHaveLength(10);
  });

  it("renders headings with correct titles", () => {
    render(<FooterNavigation />);
    expect(screen.getAllByText("Vehicles").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Certified Program").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Resources").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("About Toyota").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Social").length).toBeGreaterThanOrEqual(1);
  });

  it("renders links using semantic list structure (ul > li)", () => {
    render(<FooterNavigation />);
    const lists = screen.getAllByRole("list");
    expect(lists.length).toBeGreaterThanOrEqual(5);
  });

  it("renders navigation links", () => {
    render(<FooterNavigation />);
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(25);
  });

  it("all links navigate to home as placeholder", () => {
    render(<FooterNavigation />);
    const links = screen.getAllByRole("link");
    for (const link of links) {
      expect(link).toHaveAttribute("href", "/");
    }
  });

  it("renders links as anchor elements for keyboard accessibility", () => {
    render(<FooterNavigation />);
    const links = screen.getAllByRole("link");
    for (const link of links) {
      expect(link.tagName).toBe("A");
    }
  });

  it("Social links display external arrow indicator", () => {
    render(<FooterNavigation />);
    const youtubeLinks = screen.getAllByRole("link", { name: YOUTUBE_PATTERN });
    const hasIcon = youtubeLinks.some((link) => link.querySelector('[data-slot="icon"]'));
    expect(hasIcon).toBe(true);
  });

  it("YouTube social link renders IconArrowRight with -rotate-45", () => {
    render(<FooterNavigation />);
    const youtubeLinks = screen.getAllByRole("link", { name: YOUTUBE_PATTERN });
    const hasRotatedArrow = youtubeLinks.some((link) =>
      Boolean(link.querySelector('svg[data-slot="icon"].-rotate-45'))
    );
    expect(hasRotatedArrow).toBe(true);
  });

  it("Instagram social link renders IconArrowRight with -rotate-45", () => {
    render(<FooterNavigation />);
    const instagramLinks = screen.getAllByRole("link", { name: INSTAGRAM_PATTERN });
    const hasRotatedArrow = instagramLinks.some((link) =>
      Boolean(link.querySelector('svg[data-slot="icon"].-rotate-45'))
    );
    expect(hasRotatedArrow).toBe(true);
  });

  it("TikTok social link renders IconArrowRight with -rotate-45", () => {
    render(<FooterNavigation />);
    const tiktokLinks = screen.getAllByRole("link", { name: TIKTOK_PATTERN });
    const hasRotatedArrow = tiktokLinks.some((link) =>
      Boolean(link.querySelector('svg[data-slot="icon"].-rotate-45'))
    );
    expect(hasRotatedArrow).toBe(true);
  });

  it("uses grid-aligned columns on desktop (subgrid for PageGrid alignment)", () => {
    const { container } = render(<FooterNavigation />);
    const desktopNav = container.querySelector(".lg\\:grid-cols-subgrid");
    expect(desktopNav).toBeInTheDocument();
    const columns = desktopNav?.querySelectorAll('[class*="col-span-"]');
    expect(columns?.length).toBe(5);
  });

  it("renders mobile accordion container", () => {
    const { container } = render(<FooterNavigation />);
    const mobileContainer = container.querySelector(".lg\\:hidden");
    expect(mobileContainer).toBeInTheDocument();
  });

  it("only renders headings for sections with links", () => {
    // With default data all 5 sections have links, rendered in both desktop + mobile paths
    render(<FooterNavigation />);
    const headings = screen.getAllByRole("heading", { level: 3 });
    // 5 sections × 2 render paths (desktop columns + mobile accordion) = 10
    expect(headings).toHaveLength(10);
  });

  it("filters out sections with no links", async () => {
    const { footerSections } = await import("../../data/footer-links");

    footerSections.push({ title: "Empty", links: [] });

    try {
      render(<FooterNavigation />);
      expect(screen.queryByText("Empty")).not.toBeInTheDocument();
    } finally {
      footerSections.pop();
    }
  });

  it("renders nothing when no sections have links", async () => {
    const { footerSections } = await import("../../data/footer-links");

    const originalLinks = footerSections.map((section) => section.links);
    for (const section of footerSections) {
      section.links = [];
    }

    try {
      const { container } = render(<FooterNavigation />);
      expect(container.firstChild).toBeNull();
    } finally {
      for (const [index, section] of footerSections.entries()) {
        section.links = originalLinks[index] ?? [];
      }
    }
  });
});
