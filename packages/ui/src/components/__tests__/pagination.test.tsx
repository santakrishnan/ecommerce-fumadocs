/// <reference types="@testing-library/jest-dom/vitest" />
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@ucmp/ui";
import { render, screen } from "@ucmp/vitest-config/test-utils";
import { describe, expect, it } from "vitest";

describe("Pagination", () => {
  describe("Container", () => {
    it("renders as a nav with role=navigation", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      const nav = screen.getByRole("navigation");
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveAttribute("aria-label", "pagination");
    });

    it("renders content with pill styling (bg-surface-primary rounded-full)", () => {
      const { container } = render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      const content = container.querySelector('[data-slot="pagination-content"]');
      expect(content).toHaveClass("bg-surface-primary");
      expect(content).toHaveClass("rounded-full");
      expect(content).toHaveClass("px-3.5");
      expect(content).toHaveClass("h-12");
      expect(content).toHaveClass("w-auto");
    });

    it("has gap-2 (8px) between items", () => {
      const { container } = render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      const content = container.querySelector('[data-slot="pagination-content"]');
      expect(content).toHaveClass("gap-2");
    });
  });

  describe("Page numbers", () => {
    it("renders page numbers as plain text links (not buttons)", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      const link = screen.getByText("1");
      expect(link.tagName).toBe("A");
      expect(link.closest("button")).toBeNull();
    });

    it("active page has text-text-primary and aria-current=page", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="#" isActive>1</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      const link = screen.getByText("1");
      expect(link).toHaveClass("text-text-primary-light");
      expect(link).toHaveAttribute("aria-current", "page");
    });

    it("inactive page has text-text-tertiary", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="#">2</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      const link = screen.getByText("2");
      expect(link).toHaveClass("text-text-tertiary-light");
    });

    it("page numbers use w-6 width via Button", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      const link = screen.getByText("1");
      expect(link).toHaveClass("w-6");
    });

    it("page numbers have correct typography (text-sm font-semibold leading-heading tracking-tightest)", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      const link = screen.getByText("1");
      expect(link).toHaveClass("text-sm");
      expect(link).toHaveClass("font-semibold");
      expect(link).toHaveClass("leading-heading");
      expect(link).toHaveClass("tracking-tightest");
    });
  });

  describe("Previous/Next arrows", () => {
    it("renders arrows as icons only (no text labels)", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      const prev = screen.getByLabelText("Go to previous page");
      const next = screen.getByLabelText("Go to next page");
      expect(prev).toBeInTheDocument();
      expect(next).toBeInTheDocument();
      // No "Previous" or "Next" text visible
      expect(screen.queryByText("Previous")).not.toBeInTheDocument();
      expect(screen.queryByText("Next")).not.toBeInTheDocument();
    });

    it("previous arrow has aria-disabled when disabled", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious disabled href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      const prev = screen.getByLabelText("Go to previous page");
      expect(prev).toHaveAttribute("aria-disabled", "true");
    });

    it("next arrow has aria-disabled when disabled", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationNext disabled href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      const next = screen.getByLabelText("Go to next page");
      expect(next).toHaveAttribute("aria-disabled", "true");
    });

    it("disabled arrows have reduced opacity", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious disabled href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      const prev = screen.getByLabelText("Go to previous page");
      expect(prev).toHaveClass("opacity-50");
    });

    it("arrow icons are size-6 (24px)", () => {
      const { container } = render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("size-6");
    });
  });

  describe("Ellipsis", () => {
    it("renders as text '...' not an icon", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      expect(screen.getByText("...")).toBeInTheDocument();
      // No SVG icon for ellipsis
      const ellipsis = screen.getByText("...");
      expect(ellipsis.querySelector("svg")).toBeNull();
    });

    it("ellipsis has same typography as page numbers", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      const ellipsis = screen.getByText("...");
      expect(ellipsis).toHaveClass("text-sm");
      expect(ellipsis).toHaveClass("font-semibold");
      expect(ellipsis).toHaveClass("w-6");
    });

    it("ellipsis has aria-hidden", () => {
      const { container } = render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      const ellipsis = container.querySelector('[data-slot="pagination-ellipsis"]');
      expect(ellipsis).toHaveAttribute("aria-hidden", "true");
    });

    it("ellipsis has sr-only text for screen readers", () => {
      const { container } = render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      const srOnly = container.querySelector(".sr-only");
      expect(srOnly).toBeInTheDocument();
      expect(srOnly).toHaveTextContent("More pages");
    });
  });

  describe("PaginationLink size prop", () => {
    it("default size (icon-sm) has w-6", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="#">1</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      const link = screen.getByText("1");
      expect(link).toHaveClass("w-6");
      expect(link).toHaveClass("text-sm");
    });

    it("sm size renders with Button sm variant", () => {
      render(
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationLink href="#" size="sm">Icon</PaginationLink>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      );
      const link = screen.getByText("Icon");
      expect(link).toHaveClass("gap-1");
    });
  });
});
