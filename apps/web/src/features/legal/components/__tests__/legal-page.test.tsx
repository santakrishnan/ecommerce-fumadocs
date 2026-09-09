/**
 * Tests for LegalPage component
 */

import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import {
  legalPageWithoutUpdatedLabel,
  minimalLegalPageProps,
  mockLegalPageProps,
} from "../__fixtures__/legal-page.fixture";
import { LegalPage } from "../legal-page";

// Regex patterns for screen queries (extracted to top level for performance)
const UPDATED_AS_OF_PATTERN = /UPDATED AS OF: April 7, 2026/;
const TOYOTA_MOTOR_SALES_PATTERN = /Toyota Motor Sales, U.S.A., Inc./;
const PUBLICLY_AVAILABLE_PATTERN = /Publicly available information:/;
const MEDICAL_INFO_PATTERN = /Medical information governed by the California/;
const LAST_UPDATED_PATTERN = /Last Updated: January 1, 2026/;
const UPDATED_AS_OF_FEB_PATTERN = /UPDATED AS OF: February 14, 2026/;
const UPDATED_AS_OF_SHORT_PATTERN = /UPDATED AS OF:/;
const TOYOTA_SALES_SHORT_PATTERN = /Toyota Motor Sales/;
const UNITED_STATES_ONLY_PATTERN = /United States Only/;
const MEDICAL_INFO_SHORT_PATTERN = /Medical information governed/;
const HIPAA_PATTERN = /HIPAA/;

describe("LegalPage", () => {
  describe("rendering", () => {
    it("should render the page title", () => {
      render(<LegalPage {...mockLegalPageProps} />);
      const heading = screen.getByRole("heading", { level: 1, name: "Your Privacy Rights" });
      expect(heading).toBeInTheDocument();
    });

    it("should render the section heading", () => {
      render(<LegalPage {...mockLegalPageProps} />);
      const heading = screen.getByRole("heading", { level: 2, name: "Toyota Privacy Notice" });
      expect(heading).toBeInTheDocument();
    });

    it("should render the updated date with label", () => {
      render(<LegalPage {...mockLegalPageProps} />);
      const dateText = screen.getByText(UPDATED_AS_OF_PATTERN);
      expect(dateText).toBeInTheDocument();
    });

    it("should render paragraph content", () => {
      render(<LegalPage {...mockLegalPageProps} />);
      const text = screen.getByText(TOYOTA_MOTOR_SALES_PATTERN);
      expect(text).toBeInTheDocument();
    });

    it("should render bold text within paragraphs", () => {
      render(<LegalPage {...mockLegalPageProps} />);
      const boldText = screen.getByText(
        "For purposes of this Privacy Notice, Personal Information does not include the following:"
      );
      expect(boldText).toHaveClass("font-bold");
    });

    it("should render bullet list items", () => {
      render(<LegalPage {...mockLegalPageProps} />);
      const listItem = screen.getByText(PUBLICLY_AVAILABLE_PATTERN);
      expect(listItem).toBeInTheDocument();
    });

    it("should render nested list items", () => {
      render(<LegalPage {...mockLegalPageProps} />);
      const nestedItem = screen.getByText(MEDICAL_INFO_PATTERN);
      expect(nestedItem).toBeInTheDocument();
    });
  });

  describe("props handling", () => {
    it("should use custom updated label when provided", () => {
      render(<LegalPage {...minimalLegalPageProps} />);
      const dateText = screen.getByText(LAST_UPDATED_PATTERN);
      expect(dateText).toBeInTheDocument();
    });

    it("should use default updated label when not provided", () => {
      render(<LegalPage {...legalPageWithoutUpdatedLabel} />);
      const dateText = screen.getByText(UPDATED_AS_OF_FEB_PATTERN);
      expect(dateText).toBeInTheDocument();
    });

    it("should render minimal props correctly", () => {
      render(<LegalPage {...minimalLegalPageProps} />);
      expect(screen.getByText("Legal Notice")).toBeInTheDocument();
      expect(screen.getByText("Notice")).toBeInTheDocument();
      expect(screen.getByText("This is a test paragraph.")).toBeInTheDocument();
    });
  });

  describe("styling", () => {
    it("should apply correct classes to title heading", () => {
      render(<LegalPage {...mockLegalPageProps} />);
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveClass("h1");
    });

    it("should apply correct classes to section heading", () => {
      render(<LegalPage {...mockLegalPageProps} />);
      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveClass("h3", "mb-8");
    });

    it("should apply correct classes to updated date paragraph", () => {
      render(<LegalPage {...mockLegalPageProps} />);
      const dateText = screen.getByText(UPDATED_AS_OF_SHORT_PATTERN);
      const paragraph = dateText.closest("p") as HTMLParagraphElement | null;
      expect(paragraph).not.toBeNull();
      expect(paragraph).toHaveClass("body-md", "mb-4");
    });

    it("should apply correct classes to content paragraphs", () => {
      render(<LegalPage {...mockLegalPageProps} />);
      const text = screen.getByText(TOYOTA_SALES_SHORT_PATTERN);
      const paragraph = text.closest("p") as HTMLParagraphElement | null;
      expect(paragraph).not.toBeNull();
      expect(paragraph).toHaveClass("body-md");
    });

    it("should apply correct classes to list items", () => {
      render(<LegalPage {...mockLegalPageProps} />);
      const text = screen.getByText(PUBLICLY_AVAILABLE_PATTERN);
      const listItem = text.closest("li") as HTMLLIElement | null;
      expect(listItem).not.toBeNull();
      expect(listItem).toHaveClass("body-md", "list-disc");
    });
  });

  describe("accessibility", () => {
    it("should have proper heading hierarchy", () => {
      render(<LegalPage {...mockLegalPageProps} />);
      const h1 = screen.getByRole("heading", { level: 1 });
      const h2 = screen.getByRole("heading", { level: 2 });
      expect(h1).toBeInTheDocument();
      expect(h2).toBeInTheDocument();
    });

    it("should render list with proper semantic structure", () => {
      render(<LegalPage {...mockLegalPageProps} />);
      const lists = screen.getAllByRole("list");
      expect(lists.length).toBeGreaterThan(0);
    });

    it("should have proper text content for screen readers", () => {
      render(<LegalPage {...mockLegalPageProps} />);
      const title = screen.getByText("Your Privacy Rights");
      expect(title).toBeVisible();
    });

    it("should render content in an article element", () => {
      render(<LegalPage {...mockLegalPageProps} />);
      const article = screen.getByRole("article");
      expect(article).toBeInTheDocument();
    });
  });

  describe("data-driven content", () => {
    it("should render all sections from data", () => {
      render(<LegalPage {...mockLegalPageProps} />);
      expect(mockLegalPageProps.sections.length).toBe(2);
      // Verify content from both sections is rendered
      expect(screen.getByText(TOYOTA_SALES_SHORT_PATTERN)).toBeInTheDocument();
      expect(screen.getByText(UNITED_STATES_ONLY_PATTERN)).toBeInTheDocument();
    });

    it("should render all list items from nested structure", () => {
      render(<LegalPage {...mockLegalPageProps} />);
      const firstSection = mockLegalPageProps.sections[0];
      expect(firstSection?.list?.items).toBeDefined();
      // Verify nested items are rendered
      expect(screen.getByText(MEDICAL_INFO_SHORT_PATTERN)).toBeInTheDocument();
      expect(screen.getByText(HIPAA_PATTERN)).toBeInTheDocument();
    });

    it("should render empty sections without error", () => {
      render(
        <LegalPage lastUpdated="Jan 1, 2026" sectionHeading="Test" sections={[]} title="Empty" />
      );
      expect(screen.getByRole("heading", { level: 1, name: "Empty" })).toBeInTheDocument();
    });
  });
});
