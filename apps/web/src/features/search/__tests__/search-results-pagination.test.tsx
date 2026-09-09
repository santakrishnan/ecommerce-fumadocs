/// <reference types="@testing-library/jest-dom/vitest" />

import { render, screen, userEvent } from "@ucmp/vitest-config/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  emptyPageData,
  manyPagesFirstData,
  manyPagesLastData,
  manyPagesMidData,
  sixPageData,
} from "../__fixtures__/search-results.fixture";
import { SearchResultsPagination } from "../components/search-results-grid";

const PREV_RE = /previous/i;
const NEXT_RE = /next/i;
const PAGINATION_RE = /pagination/i;

const onPageChange = vi.fn<(pageNumber: number) => void>();

describe("SearchResultsPagination", () => {
  beforeEach(() => {
    onPageChange.mockClear();
  });

  // ─── visibility ─────────────────────────────────────────────────────────────

  it("renders nothing when totalPages is 0", () => {
    const { container } = render(<SearchResultsPagination paginatedData={emptyPageData} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders a pagination nav when totalPages is 2 or more", () => {
    render(<SearchResultsPagination paginatedData={sixPageData} />);
    expect(screen.getByRole("navigation", { name: PAGINATION_RE })).toBeInTheDocument();
  });

  // ─── ≤ 6 pages: all page numbers shown ──────────────────────────────────────

  it("renders all page numbers when totalPages is 6", () => {
    render(<SearchResultsPagination paginatedData={sixPageData} />);
    for (let page = 1; page <= 6; page++) {
      expect(screen.getByRole("button", { name: `Page ${page}` })).toBeInTheDocument();
    }
  });

  it("does not render ellipsis when totalPages is 6", () => {
    render(<SearchResultsPagination paginatedData={sixPageData} />);
    expect(screen.queryByText("More pages")).not.toBeInTheDocument();
  });

  // ─── > 6 pages: condensed page window ───────────────────────────────────────

  it("always renders first and last page numbers when totalPages > 6", () => {
    render(<SearchResultsPagination paginatedData={manyPagesMidData} />);
    expect(screen.getByRole("button", { name: "Page 1" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: `Page ${manyPagesMidData.totalPages}` })
    ).toBeInTheDocument();
  });

  it("renders the current page and its ±2 neighbors on a middle page", () => {
    render(<SearchResultsPagination paginatedData={manyPagesMidData} />);
    const { currentPage } = manyPagesMidData;
    for (const page of [
      currentPage - 2,
      currentPage - 1,
      currentPage,
      currentPage + 1,
      currentPage + 2,
    ]) {
      expect(screen.getByRole("button", { name: `Page ${page}` })).toBeInTheDocument();
    }
  });

  it("renders both ellipsis when current page is far from both edges", () => {
    render(<SearchResultsPagination paginatedData={manyPagesMidData} />);
    expect(screen.getAllByText("More pages")).toHaveLength(2);
  });

  it("renders only right ellipsis when on the first page", () => {
    render(<SearchResultsPagination paginatedData={manyPagesFirstData} />);
    expect(screen.getAllByText("More pages")).toHaveLength(1);
  });

  it("renders only left ellipsis when on the last page", () => {
    render(<SearchResultsPagination paginatedData={manyPagesLastData} />);
    expect(screen.getAllByText("More pages")).toHaveLength(1);
  });

  // ─── active state ────────────────────────────────────────────────────────────

  it("marks the current page link as active", () => {
    render(<SearchResultsPagination paginatedData={manyPagesMidData} />);
    expect(
      screen.getByRole("button", { name: `Page ${manyPagesMidData.currentPage}` })
    ).toHaveAttribute("aria-current", "page");
  });

  it("does not mark other pages as active", () => {
    render(<SearchResultsPagination paginatedData={manyPagesMidData} />);
    expect(
      screen.getByRole("button", { name: `Page ${manyPagesMidData.currentPage - 1}` })
    ).not.toHaveAttribute("aria-current");
  });

  // ─── Previous / Next disabled state ─────────────────────────────────────────

  it("disables the Previous button on the first page", () => {
    render(<SearchResultsPagination paginatedData={manyPagesFirstData} />);
    expect(screen.getByRole("button", { name: PREV_RE })).toHaveAttribute("aria-disabled", "true");
  });

  it("enables the Previous button when not on the first page", () => {
    render(<SearchResultsPagination paginatedData={manyPagesMidData} />);
    expect(screen.getByRole("button", { name: PREV_RE })).toHaveAttribute("aria-disabled", "false");
  });

  it("disables the Next button on the last page", () => {
    render(<SearchResultsPagination paginatedData={manyPagesLastData} />);
    expect(screen.getByRole("button", { name: NEXT_RE })).toHaveAttribute("aria-disabled", "true");
  });

  it("enables the Next button when not on the last page", () => {
    render(<SearchResultsPagination paginatedData={manyPagesMidData} />);
    expect(screen.getByRole("button", { name: NEXT_RE })).toHaveAttribute("aria-disabled", "false");
  });

  // ─── navigation ──────────────────────────────────────────────────────────────

  it("calls onPageChange with next page when Next is clicked", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <SearchResultsPagination onPageChange={onPageChange} paginatedData={manyPagesMidData} />
    );
    await user.click(screen.getByRole("button", { name: NEXT_RE }));
    expect(onPageChange).toHaveBeenCalledWith(manyPagesMidData.currentPage + 1);
  });

  it("calls onPageChange with previous page when Previous is clicked", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <SearchResultsPagination onPageChange={onPageChange} paginatedData={manyPagesMidData} />
    );
    await user.click(screen.getByRole("button", { name: PREV_RE }));
    expect(onPageChange).toHaveBeenCalledWith(manyPagesMidData.currentPage - 1);
  });

  it("calls onPageChange with clicked page number", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <SearchResultsPagination onPageChange={onPageChange} paginatedData={manyPagesMidData} />
    );
    const targetPage = manyPagesMidData.currentPage + 2;
    await user.click(screen.getByRole("button", { name: `Page ${targetPage}` }));
    expect(onPageChange).toHaveBeenCalledWith(targetPage);
  });

  it("does not call onPageChange when Previous is clicked on the first page", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <SearchResultsPagination onPageChange={onPageChange} paginatedData={manyPagesFirstData} />
    );
    await user.click(screen.getByRole("button", { name: PREV_RE }));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("does not call onPageChange when Next is clicked on the last page", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <SearchResultsPagination onPageChange={onPageChange} paginatedData={manyPagesLastData} />
    );
    await user.click(screen.getByRole("button", { name: NEXT_RE }));
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("does not call onPageChange when loading", async () => {
    const user = userEvent.setup({ delay: null });
    render(
      <SearchResultsPagination
        isLoading
        onPageChange={onPageChange}
        paginatedData={manyPagesMidData}
      />
    );
    await user.click(screen.getByRole("button", { name: NEXT_RE }));
    expect(onPageChange).not.toHaveBeenCalled();
  });
});
