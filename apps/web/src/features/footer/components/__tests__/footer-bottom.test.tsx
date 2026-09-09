import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import { FooterBottom } from "../footer-bottom";

const TOYOTA_MOTOR_SALES_PATTERN = /toyota motor sales/i;
const LEGAL_LINKS_PATTERN = /legal links/i;
const PRIVACY_NOTICE_PATTERN = /privacy notice/i;
const LEGAL_TERMS_PATTERN = /legal terms/i;
const SITE_MAP_PATTERN = /site map/i;
const ESPANOL_PATTERN = /espanol/i;

describe("FooterBottom", () => {
  it("renders a dynamic copyright year (not hardcoded)", () => {
    render(<FooterBottom />);
    const currentYear = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(currentYear))).toBeInTheDocument();
  });

  it("renders copyright text with Toyota Motor Sales", () => {
    render(<FooterBottom />);
    expect(screen.getByText(TOYOTA_MOTOR_SALES_PATTERN)).toBeInTheDocument();
  });

  it("renders legal links inside a nav with 'Legal links' label", () => {
    render(<FooterBottom />);
    const nav = screen.getByRole("navigation", { name: LEGAL_LINKS_PATTERN });
    expect(nav).toBeInTheDocument();
  });

  it("renders all 4 legal links", () => {
    render(<FooterBottom />);
    const nav = screen.getByRole("navigation", { name: LEGAL_LINKS_PATTERN });
    const links = nav.querySelectorAll("a");
    expect(links).toHaveLength(4);
  });

  it("renders legal links using semantic list structure", () => {
    render(<FooterBottom />);
    const nav = screen.getByRole("navigation", { name: LEGAL_LINKS_PATTERN });
    const list = nav.querySelector("ul");
    expect(list).toBeInTheDocument();
    const items = nav.querySelectorAll("li");
    expect(items).toHaveLength(4);
  });

  it("legal links have correct labels", () => {
    render(<FooterBottom />);
    expect(screen.getByRole("link", { name: PRIVACY_NOTICE_PATTERN })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: LEGAL_TERMS_PATTERN })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: SITE_MAP_PATTERN })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: ESPANOL_PATTERN })).toBeInTheDocument();
  });

  it("privacy notice link navigates to /privacy", () => {
    render(<FooterBottom />);
    const privacyLink = screen.getByRole("link", { name: PRIVACY_NOTICE_PATTERN });
    expect(privacyLink).toHaveAttribute("href", "/privacy");
  });

  it("remaining legal links still use placeholder href", () => {
    render(<FooterBottom />);
    const legalTerms = screen.getByRole("link", { name: LEGAL_TERMS_PATTERN });
    const siteMap = screen.getByRole("link", { name: SITE_MAP_PATTERN });
    const espanol = screen.getByRole("link", { name: ESPANOL_PATTERN });
    expect(legalTerms).toHaveAttribute("href", "/");
    expect(siteMap).toHaveAttribute("href", "/");
    expect(espanol).toHaveAttribute("href", "/");
  });

  it("legal links are keyboard accessible (rendered as anchor elements)", () => {
    render(<FooterBottom />);
    const links = screen.getAllByRole("link");
    for (const link of links) {
      expect(link.tagName).toBe("A");
    }
  });
});
