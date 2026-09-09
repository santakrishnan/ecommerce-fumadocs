import { useState } from "react"
import type { Meta, StoryObj } from "@storybook/react"

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/pagination"

const meta = {
  title: "Components/Pagination",
  component: Pagination,
  parameters: {
    layout: "centered",
    backgrounds: { default: "grey", values: [{ name: "grey", value: "#E6E6E6" }] },
    docs: {
      description: {
        component:
          "A compact pill-shaped pagination bar with plain text page numbers, " +
          "arrow-only navigation, and text-based ellipsis. " +
          "Matches the design system spec (PEDX01-1749). " +
          "Original shadcn implementation: [shadcn/ui Pagination (Base)](https://ui.shadcn.com/docs/components/base/pagination).",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Pagination>

export default meta
type Story = StoryObj<typeof meta>

function getVisiblePages(currentPage: number, totalPages: number): number[] {
  if (totalPages <= 6) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  if (currentPage <= 4) {
    return [1, 2, 3, 4, -1, totalPages]
  }
  if (currentPage >= totalPages - 3) {
    return [1, -1, totalPages - 3, totalPages - 2, totalPages - 1, totalPages]
  }
  return [1, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages]
}

function InteractivePagination({ totalPages }: { totalPages: number }) {
  const [currentPage, setCurrentPage] = useState(1)
  const pages = getVisiblePages(currentPage, totalPages)

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            disabled={currentPage === 1}
            onClick={(e) => {
              e.preventDefault()
              setCurrentPage((p) => Math.max(1, p - 1))
            }}
          />
        </PaginationItem>
        {pages.map((page, i) =>
          page === -1 ? (
            <PaginationItem key={`ellipsis-${i}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={page}>
              <PaginationLink
                href="#"
                isActive={page === currentPage}
                onClick={(e) => {
                  e.preventDefault()
                  setCurrentPage(page)
                }}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          )
        )}
        <PaginationItem>
          <PaginationNext
            href="#"
            disabled={currentPage === totalPages}
            onClick={(e) => {
              e.preventDefault()
              setCurrentPage((p) => Math.min(totalPages, p + 1))
            }}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export const Default: Story = {
  name: "50 Pages (Interactive)",
  render: () => <InteractivePagination totalPages={50} />,
}

export const FewPages: Story = {
  name: "5 Pages (No Ellipsis)",
  render: () => <InteractivePagination totalPages={5} />,
}

export const BoundaryCase: Story = {
  name: "6 Pages (Boundary)",
  render: () => <InteractivePagination totalPages={6} />,
}

export const FirstEllipsis: Story = {
  name: "7 Pages (First Ellipsis Case)",
  render: () => <InteractivePagination totalPages={7} />,
}

export const SinglePage: Story = {
  name: "1 Page (Both Arrows Disabled)",
  render: () => <InteractivePagination totalPages={1} />,
}

export const LargeDataset: Story = {
  name: "100 Pages (Large Dataset)",
  render: () => <InteractivePagination totalPages={100} />,
}
