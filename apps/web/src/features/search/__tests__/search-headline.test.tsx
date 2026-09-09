/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";
import { SearchResultsHeadline } from "../components/search-results-headline/search-headline";

describe("SearchResultsHeadline", () => {
  describe("results-count line", () => {
    it("renders the count in the results line", () => {
      render(<SearchResultsHeadline count={42} headline="Highlander Hybrids" />);
      expect(screen.getByText("All 42 results for")).toBeInTheDocument();
    });

    it("renders count of zero", () => {
      render(<SearchResultsHeadline count={0} headline="Highlander Hybrids" />);
      expect(screen.getByText("All 0 results for")).toBeInTheDocument();
    });

    it("renders large counts", () => {
      render(<SearchResultsHeadline count={1234} headline="Highlander Hybrids" />);
      expect(screen.getByText("All 1234 results for")).toBeInTheDocument();
    });
  });

  describe("headline", () => {
    it("renders a short contextual headline", () => {
      render(<SearchResultsHeadline count={5} headline="Highlander Hybrids" />);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Highlander Hybrids");
    });

    it("renders a long contextual headline without truncation", () => {
      const longHeadline = "Highlander Hybrids with low mileage and top-rated features";
      render(<SearchResultsHeadline count={16} headline={longHeadline} />);
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(longHeadline);
    });
  });

  describe("semantic structure", () => {
    it("renders the count line as an h4", () => {
      render(<SearchResultsHeadline count={16} headline="Highlander Hybrids" />);
      expect(screen.getByRole("heading", { level: 4 })).toBeInTheDocument();
    });

    it("renders the headline as an h1", () => {
      render(<SearchResultsHeadline count={16} headline="Highlander Hybrids" />);
      expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    });

    it("renders the count line above the headline in the DOM", () => {
      render(<SearchResultsHeadline count={16} headline="Highlander Hybrids" />);
      const h4 = screen.getByRole("heading", { level: 4 });
      const h1 = screen.getByRole("heading", { level: 1 });
      expect(h4.compareDocumentPosition(h1)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    });
  });
});
