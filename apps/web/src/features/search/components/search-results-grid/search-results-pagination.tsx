"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@ucmp/ui";
import type { PaginatedData } from "../../bff/services/search-results-service";

export interface SearchResultsPaginationProps<T> {
  isLoading?: boolean;
  onPageChange?: (pageNumber: number) => Promise<void> | void;
  paginatedData: PaginatedData<T>;
}

/**
 * Client-side pagination interaction.
 *
 * Renders page controls and delegates page changes to the caller.
 * URL query-string navigation is intentionally not used.
 */
export function SearchResultsPagination<T>({
  isLoading = false,
  onPageChange,
  paginatedData,
}: SearchResultsPaginationProps<T>) {
  const { currentPage, totalPages } = paginatedData;

  if (totalPages <= 1) {
    return null;
  }

  const canGoToPrevious = currentPage > 1;
  const canGoToNext = currentPage < totalPages;

  function handlePageChange(pageNumber: number, enabled: boolean) {
    if (!enabled || isLoading) {
      return;
    }

    onPageChange?.(pageNumber);
  }

  type PageItem = number | "ellipsis-left" | "ellipsis-right";

  const pageItems: PageItem[] =
    totalPages <= 6
      ? Array.from({ length: totalPages }, (_, index) => index + 1)
      : (() => {
          const middle = Array.from(
            new Set([
              currentPage - 2,
              currentPage - 1,
              currentPage,
              currentPage + 1,
              currentPage + 2,
            ])
          ).filter((page) => page > 1 && page < totalPages);

          const firstMiddle = middle.at(0) ?? totalPages;
          const lastMiddle = middle.at(-1) ?? 1;

          return [
            1,
            ...(firstMiddle > 2 ? (["ellipsis-left"] as const) : []),
            ...middle,
            ...(lastMiddle < totalPages - 1 ? (["ellipsis-right"] as const) : []),
            totalPages,
          ];
        })();

  return (
    <Pagination>
      <span aria-atomic="true" aria-live="polite" className="sr-only">
        Page {currentPage} of {totalPages}
      </span>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            disabled={!canGoToPrevious || isLoading}
            onClick={(event) => {
              event.preventDefault();
              handlePageChange(currentPage - 1, canGoToPrevious);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handlePageChange(currentPage - 1, canGoToPrevious);
              }
            }}
            text=""
          />
        </PaginationItem>

        {pageItems.map((item) => {
          if (item === "ellipsis-left" || item === "ellipsis-right") {
            return (
              <PaginationItem key={item}>
                <PaginationEllipsis />
              </PaginationItem>
            );
          }

          return (
            <PaginationItem key={item}>
              <PaginationLink
                aria-disabled={isLoading || undefined}
                aria-label={`Page ${item}`}
                isActive={item === currentPage}
                onClick={(event) => {
                  event.preventDefault();
                  handlePageChange(item, item !== currentPage);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handlePageChange(item, item !== currentPage);
                  }
                }}
                tabIndex={isLoading || item === currentPage ? -1 : 0}
              >
                {item}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        <PaginationItem>
          <PaginationNext
            disabled={!canGoToNext || isLoading}
            onClick={(event) => {
              event.preventDefault();
              handlePageChange(currentPage + 1, canGoToNext);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                handlePageChange(currentPage + 1, canGoToNext);
              }
            }}
            text=""
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
