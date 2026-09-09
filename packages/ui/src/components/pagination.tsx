import * as React from "react"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Button } from "@/components/button"
import { IconCaretLeft, IconCaretRight } from "@/icons"

/* ─── CVA Variants ─── */
const paginationVariants = cva(
  "mx-auto flex w-full justify-center",
)

const paginationContentVariants = cva(
  "flex items-center rounded-full bg-surface-primary px-3.5 h-12 w-auto gap-2 md:gap-6 lg:gap-2",
)

/* ─── Interfaces ─── */

interface PaginationProps extends React.ComponentProps<"nav"> {}

interface PaginationContentProps extends React.ComponentProps<"ul"> {}

interface PaginationItemProps extends React.ComponentProps<"li"> {}

interface PaginationLinkProps extends React.ComponentProps<"a"> {
  isActive?: boolean
  size?: Pick<React.ComponentProps<typeof Button>, "size">["size"]
}

interface PaginationPreviousProps extends React.ComponentProps<typeof PaginationLink> {
  disabled?: boolean
  text?: string
}

interface PaginationNextProps extends React.ComponentProps<typeof PaginationLink> {
  disabled?: boolean
  text?: string
}

interface PaginationEllipsisProps extends React.ComponentProps<"span"> {}

/* ─── Components ─── */

function Pagination({
  className,
  ...props
}: PaginationProps) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      data-slot="pagination"
      className={cn(paginationVariants(), className)}
      {...props}
    />
  )
}

function PaginationContent({
  className,
  ...props
}: PaginationContentProps) {
  return (
    <ul
      data-slot="pagination-content"
      data-surface="light"
      className={cn(paginationContentVariants(), className)}
      {...props}
    />
  )
}

function PaginationItem({ className, ...props }: PaginationItemProps) {
  return (
    <li
      data-slot="pagination-item"
      className={cn("flex items-center justify-center", className)}
      {...props}
    />
  )
}

function PaginationLink({
  className,
  isActive,
  size = "icon-sm",
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      variant="primary"
      size={size}
      surface="dark"
      nativeButton={false}
      className={cn(
        "min-h-0 min-w-0 w-6 px-0 py-0 text-sm font-semibold leading-heading tracking-tightest",
        isActive ? "text-text-primary-light" : "text-text-tertiary-light",
        className
      )}
      render={
        <a
          aria-current={isActive ? "page" : undefined}
          data-slot="pagination-link"
          data-active={isActive}
          {...props}
        />
      }
    />
  )
}

function PaginationPrevious({
  className,
  disabled,
  text: _text,
  ...props
}: PaginationPreviousProps) {
  return (
    <PaginationLink
      aria-label="Go to previous page"
      data-slot="pagination-previous"
      size="icon-sm"
      className={cn(
        "w-auto",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      {...props}
    >
      <IconCaretLeft className="size-6" />
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  disabled,
  text: _text,
  ...props
}: PaginationNextProps) {
  return (
    <PaginationLink
      aria-label="Go to next page"
      data-slot="pagination-next"
      size="icon-sm"
      className={cn(
        "w-auto",
        disabled && "pointer-events-none opacity-50",
        className
      )}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      {...props}
    >
      <IconCaretRight className="size-6" />
    </PaginationLink>
  )
}

function PaginationEllipsis({
  className,
  ...props
}: PaginationEllipsisProps) {
  return (
    <span
      aria-hidden
      data-slot="pagination-ellipsis"
      className={cn(
        "flex w-6 items-center justify-center text-sm font-semibold leading-heading tracking-tightest text-text-tertiary select-none",
        className
      )}
      {...props}
    >
      ...
      <span className="sr-only">More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
}

export type {
  PaginationProps,
  PaginationContentProps,
  PaginationEllipsisProps,
  PaginationItemProps,
  PaginationLinkProps,
  PaginationNextProps,
  PaginationPreviousProps,
}
